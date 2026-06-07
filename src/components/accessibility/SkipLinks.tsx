'use client';

export default function SkipLinks() {
  return (
    <nav aria-label="Links de navegacao rapida" className="skip-links">
      <a href="#main-content" className="skip-link">
        Ir para o conteudo principal
      </a>
      <a href="#main-navigation" className="skip-link">
        Ir para navegacao
      </a>
    </nav>
  );
}
