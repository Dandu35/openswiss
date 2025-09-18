export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 mt-10">
      <div className="container py-6 text-xs text-neutral-400 flex flex-wrap gap-3 items-center justify-between">
        <p>© {new Date().getFullYear()} openSwiss</p>
        <div className="flex gap-4">
          <a className="hover:underline" href="#">Privacidad</a>
          <a className="hover:underline" href="#">Términos</a>
        </div>
      </div>
    </footer>
  );
}
