import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, UtensilsCrossed, Zap, Clock, Shield } from 'lucide-react';

const ROLE_HOME = { admin: '/admin', staff: '/staff', student: '/dashboard' };

// 12 curated food images for the mosaic collage
const COLLAGE_IMAGES = [
  '/assets/food/pizza&burger/pepperoni_feast_pizza.jpg',
  '/assets/food/lunch/chicken_biriyani.jpg',
  '/assets/food/dessert/choco_lava_cake.jpg',
  '/assets/food/breakfast/masala_dosa.jpg',
  '/assets/food/pizza&burger/classic_cheeseburger.jpg',
  '/assets/food/lunch/south_indian_meals.jpg',
  '/assets/food/snacks/momos.jpg',
  '/assets/food/dessert/gulab_jamun.jpg',
  '/assets/food/breakfast/ghee_pongal.jpg',
  '/assets/food/pizza&burger/bbq_chicken_pizza.jpg',
  '/assets/food/snacks/french_fries.jpg',
  '/assets/food/lunch/paneer_fried_rice.jpg',
];

const BADGES = [
  { icon: Zap,    label: 'Real-time Queue' },
  { icon: Clock,  label: 'Pre-Order Slots' },
  { icon: Shield, label: 'Secure & Fast'   },
];

export default function Landing() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    if (user) navigate(ROLE_HOME[user.role] || '/dashboard', { replace: true });
  }, [user, navigate]);

  if (user) return null;

  return (
    <div className="landing-fullscreen">
      {/* ── Mosaic food collage background ── */}
      <div className="landing-mosaic" aria-hidden="true">
        {COLLAGE_IMAGES.map((src, i) => (
          <div
            key={i}
            className="mosaic-cell"
            style={{ backgroundImage: `url(${src})`, animationDelay: `${i * 0.15}s` }}
          />
        ))}
        {/* Dark overlay for readability */}
        <div className="mosaic-overlay" />
      </div>

      {/* ── Centered hero card ── */}
      <div className="landing-hero-card">
        {/* Logo */}
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <UtensilsCrossed size={22} />
          </div>
          <span className="landing-logo-name">Smart<span>Serve</span></span>
        </div>

        {/* Headline */}
        <h1 className="landing-headline">
          Skip the Queue.<br />
          <span className="landing-headline-accent">Eat Smarter.</span>
        </h1>

        <p className="landing-tagline">
          Pre-order meals, track your token live, and enjoy a frictionless
          canteen experience — built for your campus.
        </p>

        {/* Feature badges */}
        <div className="landing-badges">
          {BADGES.map(({ icon: Icon, label }) => (
            <div className="landing-badge" key={label}>
              <Icon size={13} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="landing-ctas">
          <Link to="/register" className="landing-btn-primary">
            Get Started Free <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="landing-btn-outline">
            Sign In
          </Link>
        </div>

        <p className="landing-footer-note">Free for all students &amp; staff · No credit card required</p>
      </div>
    </div>
  );
}
