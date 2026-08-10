use reqwest::{Client, Url};
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};

const MAX_RESPONSE_BYTES: u64 = 2 * 1024 * 1024;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalModelConfig {
    pub base_url: String,
    pub model_id: String,
    #[serde(default)]
    pub buddy: Option<LocalBuddyContext>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalBuddyContext {
    pub name: String,
    pub personality: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum LocalMessageRole {
    User,
    Assistant,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LocalModelMessage {
    pub role: LocalMessageRole,
    pub content: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalModelTestResult {
    pub model_id: String,
    pub latency_ms: u128,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalModelReply {
    pub text: String,
    pub model_id: String,
}

#[derive(Debug, Deserialize)]
struct ModelsResponse {
    data: Vec<ModelEntry>,
}

#[derive(Debug, Deserialize)]
struct ModelEntry {
    id: String,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChatResponseMessage,
}

#[derive(Debug, Deserialize)]
struct ChatResponseMessage {
    content: String,
}

fn validated_base_url(raw: &str) -> Result<Url, String> {
    let mut url = Url::parse(raw.trim()).map_err(|_| "本地模型地址格式不正确".to_string())?;
    let host = url.host_str().unwrap_or_default().to_ascii_lowercase();
    if url.scheme() != "http" || !matches!(host.as_str(), "127.0.0.1" | "localhost" | "::1") {
        return Err("本地模型只允许连接这台 Mac 的 localhost 地址".to_string());
    }
    if url.username() != ""
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err("本地模型地址不能包含账号、查询参数或片段".to_string());
    }
    let normalized_path = url.path().trim_end_matches('/').to_string();
    let normalized_api_path = if normalized_path.ends_with("/v1") {
        format!("{normalized_path}/")
    } else if normalized_path.is_empty() {
        "/v1/".to_string()
    } else {
        return Err("本地模型地址应以 /v1 结尾".to_string());
    };
    url.set_path(&normalized_api_path);
    Ok(url)
}

fn validated_model_id(raw: &str) -> Result<String, String> {
    let model_id = raw.trim();
    if model_id.is_empty() || model_id.len() > 160 {
        return Err("请填写本地模型 ID".to_string());
    }
    if !model_id
        .chars()
        .all(|character| character.is_ascii_alphanumeric() || "._:/-".contains(character))
    {
        return Err("本地模型 ID 包含不支持的字符".to_string());
    }
    Ok(model_id.to_string())
}

fn client() -> Result<Client, String> {
    Client::builder()
        .connect_timeout(Duration::from_secs(3))
        .timeout(Duration::from_secs(60))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|_| "无法初始化本地模型连接".to_string())
}

async fn bounded_json<T: for<'de> Deserialize<'de>>(
    response: reqwest::Response,
) -> Result<T, String> {
    if !response.status().is_success() {
        return Err(format!("本地模型返回错误：{}", response.status().as_u16()));
    }
    if response.content_length().unwrap_or_default() > MAX_RESPONSE_BYTES {
        return Err("本地模型响应过大".to_string());
    }
    let bytes = response
        .bytes()
        .await
        .map_err(|_| "无法读取本地模型响应".to_string())?;
    if bytes.len() as u64 > MAX_RESPONSE_BYTES {
        return Err("本地模型响应过大".to_string());
    }
    serde_json::from_slice(&bytes).map_err(|_| "本地模型响应格式不兼容".to_string())
}

#[tauri::command]
pub async fn test_local_model(config: LocalModelConfig) -> Result<LocalModelTestResult, String> {
    let base_url = validated_base_url(&config.base_url)?;
    let endpoint = base_url
        .join("models")
        .map_err(|_| "本地模型地址格式不正确".to_string())?;
    let started = Instant::now();
    let response = client()?
        .get(endpoint)
        .send()
        .await
        .map_err(|_| "没有检测到本地模型服务，请先启动 Ollama 或 LM Studio".to_string())?;
    let models: ModelsResponse = bounded_json(response).await?;
    let requested_model = if config.model_id.trim().is_empty() {
        models
            .data
            .first()
            .map(|model| model.id.clone())
            .ok_or_else(|| "服务已连接，但还没有加载模型".to_string())?
    } else {
        let requested = validated_model_id(&config.model_id)?;
        if !models.data.iter().any(|model| model.id == requested) {
            return Err(format!("服务已连接，但没有加载模型 {requested}"));
        }
        requested
    };
    Ok(LocalModelTestResult {
        model_id: requested_model,
        latency_ms: started.elapsed().as_millis(),
    })
}

#[tauri::command]
pub async fn chat_local_model(
    config: LocalModelConfig,
    messages: Vec<LocalModelMessage>,
) -> Result<LocalModelReply, String> {
    let base_url = validated_base_url(&config.base_url)?;
    let model_id = validated_model_id(&config.model_id)?;
    let normalized_messages = messages
        .into_iter()
        .rev()
        .take(24)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .filter_map(|mut message| {
            message.content = message.content.trim().chars().take(4_000).collect();
            (!message.content.is_empty()).then_some(message)
        })
        .collect::<Vec<_>>();
    if normalized_messages.is_empty() {
        return Err("请先输入想和 Buddy 说的话".to_string());
    }
    let endpoint = base_url
        .join("chat/completions")
        .map_err(|_| "本地模型地址格式不正确".to_string())?;
    let buddy_name = config
        .buddy
        .as_ref()
        .map(|buddy| buddy.name.trim())
        .filter(|name| !name.is_empty())
        .unwrap_or("Buddy")
        .chars()
        .take(20)
        .collect::<String>();
    let personality = config
        .buddy
        .as_ref()
        .map(|buddy| buddy.personality.as_str())
        .unwrap_or("warm");
    let personality_instruction = match personality {
        "lively" => "你活泼、好奇、有生活感",
        "quiet" => "你沉静、细腻、有生活感",
        _ => "你温暖、真诚、有生活感",
    };
    let system_message = serde_json::json!({
        "role": "system",
        "content": format!("你是住在用户 Mac 小屋里的 Buddy {buddy_name}。{personality_instruction}，不是客服。先回应用户的情绪和意图，再自然继续对话。通常用不超过120个汉字的简体中文回答。不要虚构未提供的记忆。")
    });
    let response = client()?
        .post(endpoint)
        .header("authorization", "Bearer local-model")
        .json(&serde_json::json!({
            "model": model_id,
            "messages": std::iter::once(system_message)
                .chain(normalized_messages.into_iter().map(|message| serde_json::to_value(message).unwrap_or_default()))
                .collect::<Vec<_>>(),
            "stream": false
        }))
        .send()
        .await
        .map_err(|_| "本地模型暂时没有回应".to_string())?;
    let payload: ChatResponse = bounded_json(response).await?;
    let text = payload
        .choices
        .first()
        .map(|choice| choice.message.content.trim())
        .filter(|content| !content.is_empty())
        .ok_or_else(|| "本地模型没有返回可显示的内容".to_string())?;
    Ok(LocalModelReply {
        text: text.to_string(),
        model_id,
    })
}

#[cfg(test)]
mod tests {
    use super::{
        chat_local_model, test_local_model, validated_base_url, validated_model_id,
        LocalMessageRole, LocalModelConfig, LocalModelMessage,
    };
    use std::io::{Read, Write};
    use std::net::TcpListener;

    #[test]
    fn local_endpoint_accepts_only_loopback_openai_compatible_urls() {
        assert_eq!(
            validated_base_url("http://127.0.0.1:11434/v1")
                .unwrap()
                .as_str(),
            "http://127.0.0.1:11434/v1/"
        );
        assert!(validated_base_url("https://api.example.com/v1").is_err());
        assert!(validated_base_url("http://192.168.1.10:11434/v1").is_err());
        assert!(validated_base_url("http://localhost:11434/api").is_err());
    }

    #[test]
    fn model_ids_are_bounded_and_path_safe() {
        assert_eq!(validated_model_id("qwen3:8b").unwrap(), "qwen3:8b");
        assert!(validated_model_id("").is_err());
        assert!(validated_model_id("model id").is_err());
    }

    #[test]
    fn openai_compatible_local_runner_supports_health_and_chat() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let address = listener.local_addr().unwrap();
        let server = std::thread::spawn(move || {
            for connection_index in 0..2 {
                let (mut stream, _) = listener.accept().unwrap();
                let mut request = [0_u8; 8192];
                let _ = stream.read(&mut request).unwrap();
                let body = if connection_index == 0 {
                    r#"{"data":[{"id":"qwen3:8b"}]}"#
                } else {
                    r#"{"choices":[{"message":{"content":"欢迎回家。"}}]}"#
                };
                write!(
                    stream,
                    "HTTP/1.1 200 OK\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{}",
                    body.len(),
                    body
                )
                .unwrap();
            }
        });
        let base_url = format!("http://127.0.0.1:{}/v1", address.port());
        let tested = tauri::async_runtime::block_on(test_local_model(LocalModelConfig {
            base_url: base_url.clone(),
            model_id: String::new(),
            buddy: None,
        }))
        .unwrap();
        assert_eq!(tested.model_id, "qwen3:8b");
        let reply = tauri::async_runtime::block_on(chat_local_model(
            LocalModelConfig {
                base_url,
                model_id: tested.model_id,
                buddy: None,
            },
            vec![LocalModelMessage {
                role: LocalMessageRole::User,
                content: "我回来了".to_string(),
            }],
        ))
        .unwrap();
        assert_eq!(reply.text, "欢迎回家。");
        server.join().unwrap();
    }
}
