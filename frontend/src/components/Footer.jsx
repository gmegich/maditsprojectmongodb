import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="site-footer">
    <div className="container site-footer__grid">
      <div>
        <h3>South Sudan Marketplace</h3>
        <p>
          Connecting South Sudanese suppliers with South Sudanese consumers living in
          Kenya.
        </p>
      </div>
      <div>
        <h4>Explore</h4>
        <Link to="/products">Browse products</Link>
        <Link to="/register">Become a seller</Link>
        <Link to="/login">Sign in</Link>
      </div>
      <div>
        <h4>Project</h4>
        <p>Undergraduate CS project — Kabarak University</p>
        <p>Phase 1: Architecture &amp; setup</p>
      </div>
    </div>
    <div className="site-footer__bottom">
      <p>&copy; {new Date().getFullYear()} South Sudan Marketplace</p>
    </div>
  </footer>
);

export default Footer;
