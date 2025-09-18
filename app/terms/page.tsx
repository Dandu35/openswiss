export const metadata = { title: 'Términos y Condiciones' };

export default function TermsPage() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Términos y Condiciones</h1>
      <p>Al usar openSwiss aceptas estos términos.</p>

      <h2>Uso del servicio</h2>
      <ul>
        <li>Prohibido uso ilegal o para infringir derechos.</li>
        <li>No garantizamos disponibilidad ininterrumpida.</li>
      </ul>

      <h2>Propiedad intelectual</h2>
      <p>Conservas la titularidad de tus contenidos. Nos concedes permiso limitado para procesarlos técnicamente.</p>

      <h2>Limitación de responsabilidad</h2>
      <p>El servicio se ofrece “tal cual”. No asumimos responsabilidad por daños indirectos o pérdida de datos.</p>

      <h2>Planes y pagos</h2>
      <p>Los planes de pago se facturarán según precios anunciados. Podrán cambiar con aviso.</p>

      <h2>Cambios</h2>
      <p>Podemos actualizar estos términos. Publicaremos la fecha de actualización.</p>

      <h2>Contacto</h2>
      <p>soporte@openswiss.test</p>
      <p>Fecha: {new Date().toISOString().slice(0,10)}</p>
    </div>
  );
}
