"use client"
import { useEffect } from "react"

export default function LandingClient() {
  useEffect(() => {
    // Reveal on scroll
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))

    // Navbar scroll
    const nav = document.getElementById('main-nav')
    const handleScroll = () => {
      if (nav) nav.style.background = window.scrollY > 20
        ? 'rgba(10,10,10,0.92)'
        : 'rgba(10,10,10,0.75)'
    }
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      obs.disconnect()
    }
  }, [])

  return (
    <>
      <style>{`
        /* ---- RESET ---- */
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        /* ---- TOKENS ---- */
        :root{
          --black:#0a0a0a;--off-black:#111110;--dark:#1c1c1a;--mid:#3a3a38;
          --muted:#6b6b68;--subtle:#a8a8a4;--line:rgba(255,255,255,0.08);
          --white:#ffffff;--off-white:#f8f7f4;--cream:#f2f0eb;
          --gold:#c9a84c;--gold-dim:rgba(201,168,76,0.15);
          --sf:'-apple-system','BlinkMacSystemFont','SF Pro Display','SF Pro Text','Helvetica Neue',sans-serif;
          --serif:'Instrument Serif',Georgia,serif;
        }

        /* ---- BASE ---- */
        html{scroll-behavior:smooth}
        body{
          font-family:var(--sf);
          background:var(--black);color:var(--white);font-size:16px;line-height:1.6;
          overflow-x:hidden;-webkit-font-smoothing:antialiased;
          -moz-osx-font-smoothing:grayscale;
        }
        body::before{
          content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity:0.032
        }

        /* ---- NAV ---- */
        nav{
          position:fixed;top:0;left:0;right:0;z-index:100;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 3rem;height:64px;
          border-bottom:1px solid var(--line);
          background:rgba(10,10,10,0.75);
          backdrop-filter:blur(24px) saturate(200%);
          -webkit-backdrop-filter:blur(24px) saturate(200%);
          transition:background .3s ease;
        }
        .logo{
          font-family:var(--sf);font-size:1.1rem;font-weight:600;
          letter-spacing:-0.02em;color:var(--white);text-decoration:none;
          display:flex;align-items:center;gap:8px;
        }
        .logo-dot{width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px var(--gold);flex-shrink:0}
        .nav-mid{display:flex;gap:2rem}
        .nav-mid a{
          font-size:0.8125rem;font-weight:400;color:var(--subtle);
          text-decoration:none;transition:color .15s ease;
          letter-spacing:-0.01em;
        }
        .nav-mid a:hover{color:var(--white)}
        .nav-r{display:flex;align-items:center;gap:10px}
        .btn-gs{
          font-size:0.8125rem;color:var(--subtle);text-decoration:none;
          padding:.4rem 1rem;border-radius:7px;
          border:1px solid rgba(255,255,255,.1);
          transition:all .15s ease;background:transparent;
          font-family:var(--sf);font-weight:400;
          -webkit-font-smoothing:antialiased;
        }
        .btn-gs:hover{color:var(--white);border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.05)}
        .btn-nc{
          font-size:0.8125rem;font-weight:500;color:var(--black);
          background:var(--white);padding:.45rem 1.1rem;border-radius:7px;
          text-decoration:none;transition:all .15s ease;
          font-family:var(--sf);letter-spacing:-0.01em;
        }
        .btn-nc:hover{background:var(--off-white);transform:translateY(-1px);box-shadow:0 4px 16px rgba(255,255,255,0.1)}
        .btn-nc:active{transform:translateY(0) scale(0.98)}

        /* ---- HERO ---- */
        .hero{
          min-height:100vh;position:relative;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          text-align:center;padding:120px 2rem 0;overflow:hidden;
        }
        .hero-glow{
          position:absolute;inset:0;z-index:0;pointer-events:none;
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%,rgba(201,168,76,.12) 0%,transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 80%,rgba(201,168,76,.05) 0%,transparent 60%)
        }
        .grid-bg{position:absolute;inset:0;z-index:0;overflow:hidden}
        .grid-bg::before{
          content:'';position:absolute;inset:0;
          background-image:
            linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px);
          background-size:60px 60px;
          mask-image:radial-gradient(ellipse 80% 70% at 50% 50%,black 40%,transparent 100%);
        }
        .hero-inner{position:relative;z-index:1;max-width:920px}
        .badge{
          display:inline-flex;align-items:center;gap:8px;
          font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;
          color:var(--gold);font-weight:500;font-family:var(--sf);
          background:var(--gold-dim);border:1px solid rgba(201,168,76,.25);
          padding:6px 14px;border-radius:20px;margin-bottom:2.5rem;
          animation:fadeUp .7s ease both;
        }
        .badge-dot{width:5px;height:5px;border-radius:50%;background:var(--gold);animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        .hero-h1{
          font-family:var(--serif);font-size:clamp(3.2rem,7vw,6.5rem);
          line-height:1.0;letter-spacing:-.03em;font-weight:400;
          margin-bottom:1.75rem;animation:fadeUp .7s .1s ease both;
        }
        .hero-h1 em{
          font-style:italic;color:transparent;
          background:linear-gradient(135deg,#e8c96e 0%,#c9a84c 50%,#a07830 100%);
          -webkit-background-clip:text;background-clip:text;
        }
        .hero-sub{
          font-size:1.0625rem;font-weight:300;color:var(--subtle);
          line-height:1.75;max-width:500px;margin:0 auto 2.5rem;
          animation:fadeUp .7s .2s ease both;font-family:var(--sf);
          letter-spacing:-0.01em;
        }
        .hero-ctas{
          display:flex;align-items:center;justify-content:center;
          gap:12px;flex-wrap:wrap;margin-bottom:5rem;
          animation:fadeUp .7s .3s ease both;
        }
        .btn-cta{
          display:inline-flex;align-items:center;gap:8px;
          font-size:.9375rem;font-weight:500;
          background:var(--white);color:var(--black);
          padding:.75rem 1.75rem;border-radius:9px;
          text-decoration:none;border:none;
          transition:transform .2s cubic-bezier(0.34,1.56,0.64,1),box-shadow .2s;
          font-family:var(--sf);letter-spacing:-.02em;
        }
        .btn-cta:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 12px 40px rgba(255,255,255,.15)}
        .btn-cta:active{transform:translateY(0) scale(0.98)}
        .btn-ol{
          display:inline-flex;align-items:center;gap:8px;
          font-size:.9375rem;font-weight:400;color:var(--subtle);
          background:transparent;padding:.75rem 1.75rem;border-radius:9px;
          text-decoration:none;border:1px solid rgba(255,255,255,.12);
          transition:all .15s ease;font-family:var(--sf);
        }
        .btn-ol:hover{color:var(--white);border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.04)}
        .btn-ol:active{transform:scale(0.98)}

        /* ---- PROOF BAR ---- */
        .proof{
          display:flex;align-items:center;justify-content:center;gap:2.5rem;
          padding:1.75rem 2rem;border-top:1px solid var(--line);width:100%;
          animation:fadeUp .7s .4s ease both;
        }
        .pstat{text-align:center}
        .pnum{font-family:var(--serif);font-size:1.8rem;display:block;line-height:1}
        .plbl{font-size:.72rem;color:var(--muted);margin-top:4px;display:block;font-family:var(--sf)}
        .pdiv{width:1px;height:40px;background:var(--line)}

        /* ---- REPORT WINDOW ---- */
        .product-sec{padding:7rem 2rem;position:relative}
        .product-sec::before{
          content:'';position:absolute;left:50%;top:0;transform:translateX(-50%);
          width:1px;height:80px;background:linear-gradient(to bottom,transparent,var(--line))
        }
        .sec-eyebrow{
          text-align:center;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;
          color:var(--muted);margin-bottom:.875rem;font-family:var(--sf);font-weight:500;
        }
        .sec-h2{
          font-family:var(--serif);font-size:clamp(2rem,4vw,3.25rem);
          text-align:center;line-height:1.1;letter-spacing:-.02em;margin-bottom:1rem;
        }
        .sec-sub{
          text-align:center;color:var(--muted);font-size:.9375rem;font-weight:300;
          max-width:460px;margin:0 auto 3.5rem;line-height:1.7;
          font-family:var(--sf);letter-spacing:-.01em;
        }
        .report-win{
          max-width:880px;margin:0 auto;background:#141412;
          border:1px solid rgba(255,255,255,.1);border-radius:14px;overflow:hidden;
          box-shadow:0 40px 120px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.04);
          transition:box-shadow .3s ease,transform .3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .report-win:hover{
          box-shadow:0 60px 160px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.08);
          transform:translateY(-4px);
        }
        .win-bar{
          display:flex;align-items:center;gap:7px;padding:14px 20px;
          background:#191917;border-bottom:1px solid rgba(255,255,255,.07);
        }
        .wd{width:12px;height:12px;border-radius:50%;transition:filter .2s}
        .win-bar:hover .wd:nth-child(1){filter:brightness(1.2)}
        .win-url{
          flex:1;background:rgba(255,255,255,.05);border-radius:6px;
          padding:5px 12px;font-size:.72rem;color:var(--muted);
          text-align:center;margin:0 12px;font-family:var(--sf);
        }
        .rep-body{padding:2.5rem}
        .rep-top{
          display:flex;align-items:flex-start;justify-content:space-between;
          margin-bottom:1.75rem;padding-bottom:1.5rem;
          border-bottom:1px solid rgba(255,255,255,.07);
        }
        .rep-brand{display:flex;align-items:center;gap:12px}
        .brand-av{
          width:40px;height:40px;border-radius:10px;
          background:linear-gradient(135deg,#2563eb,#1d4ed8);
          display:flex;align-items:center;justify-content:center;
          font-family:var(--serif);font-size:1.1rem;color:#fff;
        }
        .brand-nm{font-weight:500;font-size:.9375rem;font-family:var(--sf);letter-spacing:-.02em}
        .brand-sb{font-size:.72rem;color:var(--muted);margin-top:2px;font-family:var(--sf)}
        .rep-meta{text-align:right}
        .rep-period{font-size:.72rem;color:var(--muted);font-family:var(--sf)}
        .rep-client{font-size:1.1rem;font-family:var(--serif);margin-top:4px}
        .mrow{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
        .mc{
          background:rgba(255,255,255,.04);border-radius:12px;
          padding:1.125rem 1rem;border:1px solid rgba(255,255,255,.06);
          transition:background .15s,border-color .15s,transform .2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .mc:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.12);transform:translateY(-2px)}
        .mv{font-family:var(--serif);font-size:1.5rem;line-height:1;margin-bottom:3px}
        .ml{font-size:.68rem;color:var(--muted);font-family:var(--sf)}
        .mch{font-size:.68rem;margin-top:5px;font-weight:500;font-family:var(--sf)}
        .up{color:#4ade80}.go{color:var(--gold)}
        .crow{display:grid;grid-template-columns:2fr 1fr;gap:10px}
        .cc{
          background:rgba(255,255,255,.04);border-radius:12px;
          padding:1.125rem;border:1px solid rgba(255,255,255,.06);
          transition:background .15s;
        }
        .cc:hover{background:rgba(255,255,255,.07)}
        .ct{font-size:.68rem;color:var(--muted);margin-bottom:.875rem;font-family:var(--sf)}
        .bars{display:flex;align-items:flex-end;gap:5px;height:68px}
        .b{flex:1;border-radius:3px 3px 0 0;background:rgba(255,255,255,.1);transition:height .6s cubic-bezier(0.34,1.56,0.64,1)}
        .b.hi{background:linear-gradient(to top,#c9a84c,#e8c96e)}
        .dnut{display:flex;align-items:center;justify-content:center;height:68px}

        /* ---- STEPS ---- */
        .steps-wrap{padding:7rem 3rem;border-top:1px solid var(--line)}
        .steps-inner{max-width:1100px;margin:0 auto}
        .sec-tag{
          font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;
          color:var(--muted);display:flex;align-items:center;gap:10px;
          margin-bottom:1.25rem;font-family:var(--sf);font-weight:500;
        }
        .sec-tag::before{content:'';display:block;width:24px;height:1px;background:var(--muted)}
        .steps-h{
          font-family:var(--serif);font-size:clamp(2rem,3.5vw,3rem);
          line-height:1.1;letter-spacing:-.02em;max-width:420px;margin-bottom:3.5rem;
        }
        .sgrid{display:grid;grid-template-columns:1fr 1fr;gap:2px}
        .si{
          padding:2.5rem;border:1px solid rgba(255,255,255,.07);
          position:relative;overflow:hidden;
          transition:background .25s ease,transform .3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .si:hover{background:rgba(255,255,255,.025);transform:scale(1.005)}
        .si:active{transform:scale(0.998)}
        .si:nth-child(1){border-radius:16px 0 0 0}
        .si:nth-child(2){border-radius:0 16px 0 0}
        .si:nth-child(3){border-radius:0 0 0 16px}
        .si:nth-child(4){border-radius:0 0 16px 0}
        .sn{
          font-family:var(--serif);font-size:5rem;font-weight:400;
          color:rgba(255,255,255,.035);line-height:1;
          position:absolute;top:1rem;right:1.5rem;
          pointer-events:none;user-select:none;
        }
        .siw{
          width:40px;height:40px;border-radius:10px;
          border:1px solid rgba(255,255,255,.1);
          display:flex;align-items:center;justify-content:center;
          margin-bottom:1.25rem;font-size:.95rem;
          background:rgba(255,255,255,.03);
        }
        .si h3{
          font-family:var(--serif);font-size:1.15rem;font-weight:400;
          margin-bottom:.625rem;letter-spacing:-.01em;
        }
        .si p{font-size:.875rem;color:var(--muted);line-height:1.7;font-weight:300;font-family:var(--sf)}

        /* ---- FEATURES ---- */
        .feat-sec{padding:7rem 3rem;border-top:1px solid var(--line)}
        .feat-inner{max-width:1100px;margin:0 auto}
        .feat-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:3.5rem}
        .feat-h{font-family:var(--serif);font-size:clamp(2rem,3.5vw,3rem);line-height:1.1;letter-spacing:-.02em}
        .fgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.06);border-radius:16px;overflow:hidden}
        .fc{
          background:var(--off-black);padding:2rem 1.75rem;
          transition:background .2s ease,transform .2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .fc:hover{background:#161614;transform:scale(1.01)}
        .fc:active{transform:scale(0.99)}
        .fn{font-size:.68rem;color:var(--muted);letter-spacing:.06em;margin-bottom:1.5rem;font-family:var(--sf)}
        .ft{font-family:var(--serif);font-size:1.05rem;font-weight:400;margin-bottom:.5rem}
        .fd{font-size:.8125rem;color:var(--muted);line-height:1.7;font-weight:300;font-family:var(--sf)}

        /* ---- PRICING ---- */
        .price-sec{padding:7rem 3rem;border-top:1px solid var(--line)}
        .price-inner{max-width:960px;margin:0 auto}
        .price-head{text-align:center;margin-bottom:4rem}
        .price-h{font-family:var(--serif);font-size:clamp(2rem,3.5vw,3rem);letter-spacing:-.02em;line-height:1.1;margin-bottom:.75rem}
        .price-sub{color:var(--muted);font-size:.9375rem;font-weight:300;font-family:var(--sf)}
        .pgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;align-items:start}
        .plan{
          border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:2rem;
          transition:border-color .2s,transform .3s cubic-bezier(0.34,1.56,0.64,1),box-shadow .2s;
        }
        .plan:hover{border-color:rgba(255,255,255,.18);transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,.4)}
        .plan:active{transform:translateY(-2px)}
        .plan.pop{
          border-color:rgba(201,168,76,.4);
          background:rgba(201,168,76,.04);position:relative;
        }
        .plan.pop:hover{border-color:rgba(201,168,76,.7);box-shadow:0 20px 60px rgba(201,168,76,.1)}
        .pop-tag{
          position:absolute;top:-12px;left:50%;transform:translateX(-50%);
          background:var(--gold);color:var(--black);
          font-size:.65rem;font-weight:600;letter-spacing:.08em;
          text-transform:uppercase;padding:4px 14px;border-radius:20px;
          white-space:nowrap;font-family:var(--sf);
        }
        .ptier{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:1.5rem;font-family:var(--sf);font-weight:500}
        .plan.pop .ptier{color:var(--gold)}
        .pprice{font-family:var(--serif);font-size:3.25rem;line-height:1}
        .pprice sup{font-size:1.25rem;vertical-align:super}
        .pmo{font-size:.8125rem;color:var(--muted);margin-bottom:2rem;font-family:var(--sf)}
        .pdivider{height:1px;background:var(--line);margin-bottom:1.5rem}
        .plist{list-style:none;margin-bottom:2rem}
        .plist li{
          font-size:.8125rem;color:var(--muted);padding:.35rem 0;
          display:flex;gap:10px;align-items:flex-start;
          font-weight:300;font-family:var(--sf);
        }
        .plan.pop .plist li{color:rgba(255,255,255,.75)}
        .plist li::before{
          content:'';width:14px;height:14px;flex-shrink:0;margin-top:1px;border-radius:50%;
          background:rgba(255,255,255,.08) url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 7l2.5 2.5L11 4.5' stroke='%23a8a8a4' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
        }
        .plan.pop .plist li::before{background:var(--gold-dim) url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 7l2.5 2.5L11 4.5' stroke='%23c9a84c' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")}
        .btn-pg{
          display:block;text-align:center;padding:.7rem;border-radius:9px;
          font-size:.875rem;font-weight:400;text-decoration:none;
          background:transparent;color:var(--subtle);
          border:1px solid rgba(255,255,255,.12);
          transition:all .15s ease;font-family:var(--sf);
        }
        .btn-pg:hover{color:var(--white);border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.05);transform:translateY(-1px)}
        .btn-pg:active{transform:scale(0.98)}
        .btn-pgo{
          display:block;text-align:center;padding:.7rem;border-radius:9px;
          font-size:.875rem;font-weight:600;text-decoration:none;
          background:var(--gold);color:var(--black);border:none;
          transition:all .2s cubic-bezier(0.34,1.56,0.64,1);
          font-family:var(--sf);letter-spacing:-.01em;
        }
        .btn-pgo:hover{background:#d4b55e;transform:translateY(-2px) scale(1.02);box-shadow:0 8px 24px rgba(201,168,76,.3)}
        .btn-pgo:active{transform:scale(0.98)}

        /* ---- CTA ---- */
        .cta-sec{
          padding:8rem 2rem;text-align:center;
          position:relative;overflow:hidden;border-top:1px solid var(--line);
        }
        .cta-sec::before{
          content:'';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
          width:600px;height:300px;
          background:radial-gradient(ellipse,rgba(201,168,76,.1) 0%,transparent 70%);
          pointer-events:none;
        }
        .cta-h{
          font-family:var(--serif);font-size:clamp(2.5rem,5vw,4.5rem);
          line-height:1.05;letter-spacing:-.025em;margin-bottom:1rem;position:relative;
        }
        .cta-h em{font-style:italic;color:var(--gold)}
        .cta-s{font-size:1rem;color:var(--muted);font-weight:300;margin-bottom:2.5rem;position:relative;font-family:var(--sf)}
        .cta-note{font-size:.72rem;color:var(--muted);margin-top:1rem;font-family:var(--sf)}

        /* ---- FOOTER ---- */
        footer{
          padding:2.5rem 3rem;border-top:1px solid var(--line);
          display:flex;align-items:center;justify-content:space-between;
        }
        .flogo{
          font-family:var(--sf);font-size:1rem;font-weight:600;
          letter-spacing:-.02em;color:var(--white);display:flex;align-items:center;gap:8px;
        }
        footer p{font-size:.75rem;color:var(--muted);font-family:var(--sf)}

        /* ---- ANIMATIONS ---- */
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .reveal{opacity:0;transform:translateY(28px);transition:opacity .6s cubic-bezier(0.16,1,0.3,1),transform .6s cubic-bezier(0.16,1,0.3,1)}
        .reveal.visible{opacity:1;transform:translateY(0)}

        /* ---- RESPONSIVE ---- */
        @media(max-width:768px){
          nav{padding:0 1.25rem}.nav-mid{display:none}
          .hero-h1{font-size:2.75rem}.proof{gap:1.25rem;flex-wrap:wrap}
          .mrow{grid-template-columns:1fr 1fr}.crow{grid-template-columns:1fr}
          .sgrid,.fgrid,.pgrid{grid-template-columns:1fr}
          .steps-wrap,.feat-sec,.price-sec{padding:4rem 1.5rem}
          .feat-head{flex-direction:column;gap:1.5rem}
          footer{flex-direction:column;gap:1rem;text-align:center}
        }
      `}</style>

      {/* Nav */}
      <nav id="main-nav">
        <a href="/" className="logo"><span className="logo-dot"></span>Reportly</a>
        <div className="nav-mid">
          <a href="#product">Product</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="nav-r">
          <a href="/login" className="btn-gs">Sign in</a>
          <a href="/signup" className="btn-nc">Start free trial</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow"></div>
        <div className="grid-bg"></div>
        <div className="hero-inner">
          <div className="badge"><span className="badge-dot"></span>White-label reporting for marketing agencies</div>
          <h1 className="hero-h1">Your reports.<br /><em>Automated.</em><br />Branded.</h1>
          <p className="hero-sub">Most agency owners spend 3+ hours per client building monthly reports. Reportly does it in one click, under your logo, on your domain.</p>
          <div className="hero-ctas">
            <a href="/signup" className="btn-cta">Start free 14-day trial &nbsp;→</a>
            <a href="#product" className="btn-ol">See it in action</a>
          </div>
        </div>
        <div className="proof">
          <div className="pstat"><span className="pnum">3 hrs</span><span className="plbl">saved per client / month</span></div>
          <div className="pdiv"></div>
          <div className="pstat"><span className="pnum">$49</span><span className="plbl">flat agency price</span></div>
          <div className="pdiv"></div>
          <div className="pstat"><span className="pnum">100%</span><span className="plbl">your branding</span></div>
          <div className="pdiv"></div>
          <div className="pstat"><span className="pnum">5 min</span><span className="plbl">to first report</span></div>
        </div>
      </section>

      {/* Product */}
      <section className="product-sec reveal" id="product">
        <div className="sec-eyebrow">Live product</div>
        <h2 className="sec-h2">What your clients actually see</h2>
        <p className="sec-sub">A polished, branded report — fully automated, living on your domain.</p>
        <div className="report-win reveal">
          <div className="win-bar">
            <span className="wd" style={{background:'#ff5f57'}}></span>
            <span className="wd" style={{background:'#febc2e'}}></span>
            <span className="wd" style={{background:'#28c840'}}></span>
            <div className="win-url">reports.apexdigital.com / sunrise-bakery / march-2026</div>
          </div>
          <div className="rep-body">
            <div className="rep-top">
              <div className="rep-brand">
                <div className="brand-av">A</div>
                <div><div className="brand-nm">Your Agency Name</div><div className="brand-sb">Performance Report</div></div>
              </div>
              <div className="rep-meta">
                <div className="rep-period">March 2026 · Monthly</div>
                <div className="rep-client">Sunrise Bakery</div>
              </div>
            </div>
            <div className="mrow">
              <div className="mc"><div className="mv">12,480</div><div className="ml">Website visits</div><div className="mch up">↑ 18% vs last month</div></div>
              <div className="mc"><div className="mv">$3,240</div><div className="ml">Ad spend</div><div className="mch go">ROAS 4.2×</div></div>
              <div className="mc"><div className="mv">284</div><div className="ml">Conversions</div><div className="mch up">↑ 31% vs last month</div></div>
              <div className="mc"><div className="mv">2.3%</div><div className="ml">Click-through rate</div><div className="mch up">Above benchmark</div></div>
            </div>
            <div className="crow">
              <div className="cc">
                <div className="ct">Weekly traffic</div>
                <div className="bars">
                  {[42,58,51,66,80,73,88,100,91,78].map((h,i) => (
                    <div key={i} className={`b${h>=80?' hi':''}`} style={{height:`${h}%`}}></div>
                  ))}
                </div>
              </div>
              <div className="cc">
                <div className="ct">Traffic sources</div>
                <div className="dnut">
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="26" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="10"/>
                    <circle cx="36" cy="36" r="26" fill="none" stroke="#c9a84c" strokeWidth="10" strokeDasharray="70 93" strokeDashoffset="23" strokeLinecap="round"/>
                    <circle cx="36" cy="36" r="26" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="10" strokeDasharray="35 128" strokeDashoffset="-47" strokeLinecap="round"/>
                    <text x="36" y="39" textAnchor="middle" fontFamily="Instrument Serif,serif" fontSize="11" fill="white">43%</text>
                    <text x="36" y="50" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="6" fill="#6b6b68">Organic</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <div className="steps-wrap">
        <div className="steps-inner">
          <div className="reveal">
            <div className="sec-tag">How it works</div>
            <h2 className="steps-h">From signup to sent<br />in under an hour.</h2>
          </div>
          <div className="sgrid reveal">
            {[
              {n:'01',i:'🔗',t:'Connect your data',d:'One-click OAuth for Google Analytics 4, Google Ads, and Meta Ads. Authorise once — we handle every pull after that.'},
              {n:'02',i:'🎨',t:'Brand it as your own',d:'Upload your logo, set your color, point a subdomain at us. Your clients see your name everywhere — ours stays invisible.'},
              {n:'03',i:'⚡',t:'Generate in one click',d:'Hit generate. We pull the numbers, calculate performance, and build a polished report in seconds.'},
              {n:'04',i:'📤',t:'Share or schedule',d:'Copy a link, download a PDF, or schedule it — reports auto-send on the 1st of each month while you sleep.'},
            ].map(s => (
              <div className="si" key={s.n}>
                <div className="sn">{s.n}</div>
                <div className="siw">{s.i}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="feat-sec" id="features">
        <div className="feat-inner">
          <div className="feat-head reveal">
            <div>
              <div className="sec-tag">Features</div>
              <h2 className="feat-h">Built for agencies<br />who respect their time.</h2>
            </div>
            <a href="/signup" className="btn-ol" style={{flexShrink:0}}>See all features →</a>
          </div>
          <div className="fgrid reveal">
            {[
              {n:'01',t:'Full white-labeling',d:'Your logo, colors, and custom domain. Clients see reports.youragency.com — not a trace of Reportly anywhere.'},
              {n:'02',t:'Auto data pull',d:'Google Analytics 4, Google Ads, and Meta Ads via OAuth. No CSV exports. No copy-paste. Ever.'},
              {n:'03',t:'PDF + shareable link',d:'Every report has a clean shareable URL and a downloadable PDF. Both always included, always on-brand.'},
              {n:'04',t:'Scheduled delivery',d:'Set a schedule and forget it. Reports auto-generate and deliver on whatever date you choose each month.'},
              {n:'05',t:'Custom commentary',d:'Add a notes section to highlight wins or explain anomalies. Reports feel personal, not automated.'},
              {n:'06',t:'Team access',d:'Invite your whole team. Everyone generates and sends under one shared agency account.'},
            ].map(f => (
              <div className="fc" key={f.n}>
                <div className="fn">{f.n}</div>
                <div className="ft">{f.t}</div>
                <div className="fd">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="price-sec" id="pricing">
        <div className="price-inner">
          <div className="price-head reveal">
            <div className="sec-tag" style={{justifyContent:'center'}}>Pricing</div>
            <h2 className="price-h">One price. No surprises.</h2>
            <p className="price-sub">Per agency, not per seat. Not per report. One flat monthly number.</p>
          </div>
          <div className="pgrid reveal">
            <div className="plan">
              <div className="ptier">Starter</div>
              <div className="pprice"><sup>$</sup>29</div>
              <div className="pmo">per month</div>
              <div className="pdivider"></div>
              <ul className="plist">
                <li>Up to 10 clients</li><li>Google Analytics + Ads</li>
                <li>White-label branding</li><li>PDF + shareable link</li><li>2 team seats</li>
              </ul>
              <a href="/signup" className="btn-pg">Get started</a>
            </div>
            <div className="plan pop">
              <div className="pop-tag">Most popular</div>
              <div className="ptier">Agency</div>
              <div className="pprice"><sup>$</sup>49</div>
              <div className="pmo">per month</div>
              <div className="pdivider"></div>
              <ul className="plist">
                <li>Up to 30 clients</li><li>Google + Meta Ads</li>
                <li>Custom domain</li><li>Scheduled delivery</li>
                <li>Custom commentary</li><li>5 team seats</li>
              </ul>
              <a href="/signup" className="btn-pgo">Start free 14-day trial</a>
            </div>
            <div className="plan">
              <div className="ptier">Scale</div>
              <div className="pprice"><sup>$</sup>99</div>
              <div className="pmo">per month</div>
              <div className="pdivider"></div>
              <ul className="plist">
                <li>Unlimited clients</li><li>All integrations</li>
                <li>API access</li><li>Priority support</li><li>Unlimited team seats</li>
              </ul>
              <a href="/signup" className="btn-pg">Get started</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <h2 className="cta-h reveal">Stop losing hours<br />to <em>manual reports.</em></h2>
        <p className="cta-s reveal">14-day free trial. No credit card. Cancel any time.</p>
        <a href="/signup" className="btn-cta reveal" style={{fontSize:'1rem',padding:'.875rem 2.5rem',display:'inline-flex'}}>Start free trial &nbsp;→</a>
        <p className="cta-note">Agencies save an average of 3 hours per client per month.</p>
      </section>

      <footer>
        <div className="flogo"><span className="logo-dot"></span>Reportly</div>
        <p>© 2026 Reportly. Made for agencies everywhere.</p>
      </footer>
    </>
  )
}
