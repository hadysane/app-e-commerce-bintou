import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-indigo-dye text-indigo-dye-foreground">
      <div className="pattern-kente h-2 w-full" aria-hidden />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <p className="font-display text-4xl font-semibold">Bintou<span className="text-saffron">.</span></p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed opacity-80">
            Des vêtements africains contemporains, taillés dans le wax, le bazin et le kente. Porter
            ses racines, avec fierté.
          </p>
        </div>
        <div>
          <p className="text-eyebrow text-saffron">Boutique</p>
          <ul className="mt-4 space-y-2 text-sm opacity-90">
            <li><Link to="/boutique" search={{ cat: "femme" }} className="hover:text-saffron">Femme</Link></li>
            <li><Link to="/boutique" search={{ cat: "homme" }} className="hover:text-saffron">Homme</Link></li>
            <li><Link to="/boutique" search={{ cat: "accessoires" }} className="hover:text-saffron">Accessoires</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-eyebrow text-saffron">La maison</p>
          <ul className="mt-4 space-y-2 text-sm opacity-90">
            <li><Link to="/a-propos" className="hover:text-saffron">Notre histoire</Link></li>
            <li><Link to="/contact" className="hover:text-saffron">Contact</Link></li>
            <li><Link to="/admin" className="hover:text-saffron">Espace équipe</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-indigo-dye-foreground/15">
        <p className="mx-auto max-w-7xl px-5 py-6 text-xs opacity-60 md:px-8">
          © {new Date().getFullYear()} Bintou. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
