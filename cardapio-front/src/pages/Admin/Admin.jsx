import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import "./Admin.css";

const DAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=85";

export default function Admin() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("cardapio-theme");
    if (saved === "dark" || saved === "light") return saved;
    return "dark";
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dayWeek, setDayWeek] = useState("Segunda-feira");
  const [calories, setCalories] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);

  const previewImage = imageUrl || DEFAULT_IMAGE;

  useEffect(() => {
    localStorage.setItem("cardapio-theme", theme);
  }, [theme]);

  const preview = useMemo(
    () => ({
      name: name || "Nome da comida",
      description:
        description ||
        "Descrição curta do prato, ingredientes principais e observações para o cardápio.",
      dayWeek,
      calories: calories || "0",
      image: previewImage,
    }),
    [calories, dayWeek, description, name, previewImage]
  );

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setImageUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (!name.trim() || !description.trim() || !dayWeek) {
      setStatus({
        type: "error",
        message: "Preencha nome, descrição e dia da semana.",
      });
      return;
    }

    setSaving(true);

    try {
      await api.post("/refeicao", {
        name: name.trim(),
        description: description.trim(),
        dayWeek,
        calories: Number(calories) || 0,
        imageUrl: previewImage,
      });


      setStatus({ type: "success", message: "Comida publicada no cardápio." });
      setName("");
      setDescription("");
      setDayWeek("Segunda-feira");
      setCalories("");
      setImageUrl("");
      setFileName("");
      }
      catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.status === 403
            ? "Seu usuário não tem permissão de admin."
            : "Não foi possível publicar agora.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={`admin-page admin-page--${theme}`}>
      <header className="admin-topbar">
        <Link className="admin-back" to="/refeicao">
          Voltar
        </Link>
        <div>
          <p className="admin-kicker">Painel do Admin</p>
          <h1>Publicar comida</h1>
        </div>
        <button
          type="button"
          className="admin-theme"
          onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </header>

      <section className="admin-shell">
        <form className="admin-form-card" onSubmit={handleSubmit}>
          <div className="admin-form-head">
            <span>Nova refeição</span>
            <p>Cadastre o prato que aparecerá no cardápio semanal.</p>
          </div>

          <label className="admin-field">
            <span>Nome da comida</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Frango ao molho de ervas"
            />
          </label>

          <label className="admin-field">
            <span>Descrição</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Conte os ingredientes, preparo ou observações importantes."
              rows={5}
            />
          </label>

          <div className="admin-grid">
            <label className="admin-field">
              <span>Dia da semana</span>
              <select
                value={dayWeek}
                onChange={(event) => setDayWeek(event.target.value)}
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Calorias</span>
              <input
                type="number"
                min="0"
                value={calories}
                onChange={(event) => setCalories(event.target.value)}
                placeholder="420"
              />
            </label>
          </div>

          <label className="admin-field">
            <span>Imagem por URL ou caminho</span>
            <input
              value={imageUrl.startsWith("blob:") ? "" : imageUrl}
              onChange={(event) => {
                setImageUrl(event.target.value);
                setFileName("");
              }}
              placeholder="https://... ou caminho da imagem"
            />
          </label>

          <label className="admin-upload">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <span>Selecionar imagem do dispositivo</span>
            <small>{fileName || "PNG, JPG ou WEBP"}</small>
          </label>

          {status.message && (
            <p className={`admin-status admin-status--${status.type}`}>
              {status.message}
            </p>
          )}

          <button className="admin-submit" type="submit" disabled={saving}>
            {saving ? "Publicando..." : "Publicar comida"}
          </button>
        </form>

        <aside className="admin-preview">
          <div className="admin-preview-image">
            <img src={preview.image} alt={preview.name} />
            <span>{preview.dayWeek}</span>
          </div>
          <div className="admin-preview-body">
            <p className="admin-preview-label">Prévia no cardápio</p>
            <h2>{preview.name}</h2>
            <p>{preview.description}</p>
            <div className="admin-preview-meta">
              <span>{preview.calories} kcal</span>
              <span>Prato da semana</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
