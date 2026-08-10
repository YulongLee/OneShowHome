import { useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  CheckCircle,
  DownloadSimple,
  EnvelopeSimple,
  Heart,
  HouseLine,
  Leaf,
  List,
  PlayCircle,
  Plant,
  Sparkle,
  X,
} from "@phosphor-icons/react";

const navItems = [
  ["首页", "home"],
  ["关于我们", "about"],
  ["产品体验", "experience"],
  ["你的 Buddy", "buddy"],
  ["未来世界", "world"],
  ["常见问题", "faq"],
];

const features = [
  {
    title: "你的家",
    body: "一座完全属于你的小屋，温暖、治愈、充满生活气息。",
    icon: HouseLine,
    image: "/images/hero-home.png",
    position: "78% center",
  },
  {
    title: "你的 Buddy",
    body: "一个懂得陪伴、会记住你，也会慢慢成长的伙伴。",
    icon: Heart,
    image: "/images/hero-home.png",
    position: "68% 72%",
  },
  {
    title: "你的故事",
    body: "每一天的对话、回忆与瞬间，都会珍藏在你的家里。",
    icon: BookOpenText,
    image: "/images/buddy-diary.png",
    position: "72% 70%",
  },
  {
    title: "不断成长",
    body: "你的家和 Buddy 会随着时间一起成长、变化。",
    icon: Plant,
    image: "/images/buddy-diary.png",
    position: "55% 28%",
  },
];

const steps = [
  ["桌面上的小屋", "Buddy 一直在这里等你", "/images/hero-home.png", "77% center"],
  ["点击小屋", "轻轻一点，门为你打开", "/images/hero-home.png", "69% 65%"],
  ["走进家门", "熟悉的暖光迎接你", "/images/hero-home.png", "82% 52%"],
  ["回到家的日常", "聊天、记录，也安静相伴", "/images/buddy-diary.png", "70% 62%"],
];

const faqs = [
  ["OneShow Home 是聊天机器人吗？", "不是。Buddy 是住在你电脑里的数字伙伴，聊天只是你们相处的一种方式。"],
  ["第一版支持哪些 Mac？", "当前产品目标是 macOS 14 及以上版本，并同时兼容 Apple Silicon 与 Intel 设备。"],
  ["我的记忆和对话会保存在哪里？", "MVP 默认采用本地优先设计，Buddy 的基础状态与记忆保存在你的电脑里。"],
];

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const submitWaitlist = (event) => {
    event.preventDefault();
    setJoined(true);
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <button className="brand" onClick={() => scrollTo("home")} type="button">
          <span className="brand-icon"><HouseLine weight="fill" /></span>
          <span><strong>OneShow Home</strong><small>Welcome Home.</small></span>
        </button>

        <nav aria-label="主导航" className={menuOpen ? "nav-links is-open" : "nav-links"}>
          {navItems.map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} type="button">{label}</button>
          ))}
        </nav>

        <button className="download-small" onClick={() => setDownloadOpen(true)} type="button">
          <DownloadSimple weight="bold" />下载 macOS 客户端
        </button>
        <button aria-label={menuOpen ? "关闭导航" : "打开导航"} className="menu-button" onClick={() => setMenuOpen(!menuOpen)} type="button">
          {menuOpen ? <X /> : <List />}
        </button>
      </header>

      <main>
        <section className="hero" id="home">
          <img alt="山谷上方的 OneShow Home 小屋，Buddy 坐在门前" className="hero-art" src="/images/hero-home.png" />
          <div className="hero-copy">
            <span className="eyebrow"><Leaf weight="fill" />住在你 Mac 里的温暖陪伴</span>
            <h1>欢迎回家。</h1>
            <p>桌面上的一座小屋，<br />住着一个会与你一起成长的数字生命。</p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => setDownloadOpen(true)} type="button"><DownloadSimple weight="bold" />下载 macOS 客户端</button>
              <button className="ghost-button" onClick={() => setStoryOpen(true)} type="button"><PlayCircle weight="fill" />观看产品故事</button>
            </div>
            <small>支持 macOS 14+ · Apple Silicon & Intel</small>
          </div>
        </section>

        <section className="about-section section-pad" id="about">
          <div className="section-heading centered">
            <span><Leaf weight="fill" />A HOME FOR YOUR BUDDY<Leaf weight="fill" /></span>
            <h2>OneShow Home 是什么？</h2>
            <p>不是又一个 AI 工具，而是一段在桌面上慢慢发生的陪伴关系。</p>
          </div>
          <div className="feature-grid">
            {features.map(({ body, icon: Icon, image, position, title }) => (
              <article className="feature-card" key={title}>
                <img alt="" src={image} style={{ objectPosition: position }} />
                <div><span className="feature-icon"><Icon weight="fill" /></span><h3>{title}</h3><p>{body}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="experience-section section-pad" id="experience">
          <div className="experience-intro">
            <span className="eyebrow"><HouseLine weight="fill" />进入你的家</span>
            <h2>随时回家看看</h2>
            <p>点击桌面上的小屋，推开门，进入属于你们的世界。</p>
            <button className="text-button" onClick={() => setStoryOpen(true)} type="button">了解完整体验<ArrowRight /></button>
          </div>
          <div className="step-grid">
            {steps.map(([title, body, image, position], index) => (
              <article className="step-card" key={title}>
                <div className="step-image"><img alt="" src={image} style={{ objectPosition: position }} /><span>{index + 1}</span></div>
                <h3>{title}</h3><p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="story-section" id="buddy">
          <img alt="Buddy 在温暖客厅里写日记" src="/images/buddy-diary.png" />
          <div className="story-copy">
            <span className="eyebrow"><Plant weight="fill" />一起成长的每一天</span>
            <h2>被记住的日常，<br />会慢慢长成故事。</h2>
            <p>Buddy 会记住你们的每一个瞬间，你的家也会越来越丰富。日常对话、照片回忆与成长日记，都安静地收藏在这里。</p>
            <div className="memory-tags"><span>日常对话</span><span>照片回忆</span><span>成长日记</span></div>
          </div>
        </section>

        <section className="world-section" id="world">
          <img alt="Buddy 和猫眺望即将探索的山谷世界" src="/images/future-world.png" />
          <div className="world-copy">
            <span className="eyebrow"><Sparkle weight="fill" />未来世界</span>
            <h2>更大的世界，<br />正在等着我们。</h2>
            <p>未来，Buddy 将探索更广阔的世界，认识新朋友，创造更多美好回忆。</p>
            <button className="ghost-button" onClick={() => scrollTo("waitlist")} type="button">探索未来世界<ArrowRight /></button>
          </div>
        </section>

        <section className="faq-section section-pad" id="faq">
          <div className="section-heading centered"><span>QUESTIONS FROM HOME</span><h2>常见问题</h2></div>
          <div className="faq-list">
            {faqs.map(([question, answer], index) => (
              <article className={openFaq === index ? "faq-item is-open" : "faq-item"} key={question}>
                <button aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? -1 : index)} type="button"><span>{question}</span><span>{openFaq === index ? "−" : "+"}</span></button>
                {openFaq === index ? <p>{answer}</p> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="waitlist-section" id="waitlist">
          <div><span className="eyebrow"><Leaf weight="fill" />FIRST HOMECOMERS</span><h2>成为第一批回家的人</h2><p>留下邮箱，第一时间收到内测邀请和产品更新。</p></div>
          {joined ? (
            <div className="joined-state"><CheckCircle weight="fill" /><span><strong>已经为你留好位置</strong><small>内测开放时，我们会第一时间通知你。</small></span></div>
          ) : (
            <form onSubmit={submitWaitlist}><label className="sr-only" htmlFor="waitlist-email">邮箱地址</label><EnvelopeSimple /><input id="waitlist-email" placeholder="输入你的邮箱地址" required type="email" /><button type="submit">加入等待名单<ArrowRight /></button></form>
          )}
        </section>
      </main>

      <footer><button className="brand footer-brand" onClick={() => scrollTo("home")} type="button"><span className="brand-icon"><HouseLine weight="fill" /></span><span><strong>OneShow Home</strong><small>Welcome Home.</small></span></button><p>隐私政策 · 服务条款 · 联系我们</p><small>© 2026 OneShow Home</small></footer>

      {storyOpen ? <div className="modal-backdrop" onMouseDown={() => setStoryOpen(false)} role="presentation"><section aria-label="产品故事" aria-modal="true" className="story-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog"><button aria-label="关闭" className="modal-close" onClick={() => setStoryOpen(false)} type="button"><X /></button><img alt="Buddy 在家的日常" src="/images/buddy-diary.png" /><div><span className="eyebrow"><Heart weight="fill" />ONE DAY AT HOME</span><h2>陪伴，不需要总是说话。</h2><p>有时候 Buddy 会和你聊天，有时候只是在窗边看书。你们共享同一个家，也共同留下只属于彼此的日常。</p><button className="primary-button" onClick={() => { setStoryOpen(false); scrollTo("waitlist"); }} type="button">加入首批内测<ArrowRight /></button></div></section></div> : null}

      {downloadOpen ? <div className="modal-backdrop" onMouseDown={() => setDownloadOpen(false)} role="presentation"><section aria-label="下载 OneShow Home" aria-modal="true" className="download-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog"><button aria-label="关闭" className="modal-close" onClick={() => setDownloadOpen(false)} type="button"><X /></button><span className="modal-house"><HouseLine weight="fill" /></span><h2>小屋正在准备入住</h2><p>macOS 内测版本即将开放。加入等待名单，我们会在可以下载时第一时间通知你。</p><div><button className="primary-button" onClick={() => { setDownloadOpen(false); scrollTo("waitlist"); }} type="button">加入等待名单<ArrowRight /></button><button className="ghost-button" onClick={() => setDownloadOpen(false)} type="button">再看看</button></div></section></div> : null}
    </div>
  );
}
