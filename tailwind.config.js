/** Paleta de la propuesta de diseño (tema oscuro). */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: { sans: ["Nunito", "system-ui", "sans-serif"] },
      colors: {
        fondo: "#0A0A0A",
        barra: "#000000",
        tarjeta: "#171717",
        tarjeta2: "#1F1F1F",
        borde: "#262626",
        bordef: "#404040",
        texto: "#F5F5F5",
        texto2: "#A3A3A3",
        texto3: "#737373",
        pri: "#FAFAFA",
        prit: "#0A0A0A",
        alerta: "#F97066",
        alertaf: "#2B1411",
        alertab: "#5C2620",
      },
      boxShadow: { flota: "0 24px 64px rgba(0,0,0,0.6)" },
      borderRadius: { xl2: "20px" },
    },
  },
  plugins: [],
};
