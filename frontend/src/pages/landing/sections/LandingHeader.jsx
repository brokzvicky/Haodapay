import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../../../components/brand/Logo';

const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#careers', label: 'Careers' },
  { href: '#contact', label: 'Contact' },
];

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleNavClick(e, href) {
    e.preventDefault();
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <header id="home" className={`hz-landing-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container d-flex align-items-center justify-content-between" style={{ height: 72 }}>
        <a href="#home" onClick={(e) => handleNavClick(e, '#home')}>
          <Logo />
        </a>

        <nav className="d-none d-lg-flex align-items-center gap-4">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hz-landing-nav-link" onClick={(e) => handleNavClick(e, link.href)}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="d-none d-lg-flex align-items-center gap-2">
          <Link to="/careers" className="hz-landing-nav-link">
            View Openings
          </Link>
          <Link to="/login" className="btn btn-primary btn-sm px-3">
            Login
          </Link>
        </div>

        <button
          className="btn btn-light border-0 d-lg-none d-flex align-items-center justify-content-center"
          style={{ width: 38, height: 38, borderRadius: 9 }}
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="d-lg-none border-top" style={{ borderColor: 'var(--hz-border)', background: '#fff' }}>
          <div className="container d-flex flex-column py-3 gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hz-landing-nav-link py-2"
                onClick={(e) => handleNavClick(e, link.href)}
              >
                {link.label}
              </a>
            ))}
            <Link to="/careers" className="hz-landing-nav-link py-2" onClick={() => setMobileOpen(false)}>
              View Openings
            </Link>
            <Link to="/login" className="btn btn-primary btn-sm mt-2" onClick={() => setMobileOpen(false)}>
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
