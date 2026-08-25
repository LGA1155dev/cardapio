import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import "./Admin.css";

const TRIMESTERS = [1, 2, 3, 4];

const MEAL_TYPES = [
  { key: "CAFE_DA_MANHA", label: "Café da manhã" },
  { key: "ALMOCO", label: "Almoço" },
  { key: "SUCO", label: "Suco" },
  { key: "SOBREMESA", label: "Sobremesa" },
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
  const [trimestre, setTrimestre] = useState(2);
  const [semana, setSemana] = useState(4);
  const [tipo, setTipo] = useState("ALMOCO");
  const [calories, setCalories] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewObjectUrl, setPreviewObjectUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const previewImage = previewObjectUrl || imageUrl || DEFAULT_IMAGE;
  const selectedType = MEAL_TYPES.find((mealType) => mealType.key === tipo) || MEAL_TYPES[1];

  useEffect(() => {
    localStorage.setItem("cardapio-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!previewObjectUrl) return undefined;
    return () => URL.revokeObjectURL(previewObjectUrl);
  }, [previewObjectUrl]);

  const preview = useMemo(
    () => ({
      name: name || "Nome da comida",
      description:
        description ||
        "Descrição curta do prato, ingredientes principais e observações para o cardápio.",
      trimestre,
      semana,
      tipoLabel: selectedType.label,
      calories: calories || "0",
      image: previewImage,
    }),
    [calories, description, name, previewImage, selectedType.label, semana, trimestre]
  );

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setPreviewObjectUrl(URL.createObjectURL(file));
    setImageUrl("");
  }

  async function handleGenerateImage() {
    if (!name.trim() || generatingImage) return;

    setGeneratingImage(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await api.post("/refeicao/gerar-imagem", { nome: name.trim() });
      const generatedUrl = response.data?.imageUrl;

      if (!generatedUrl) {
        throw new Error("Resposta de geração inválida");
      }

      setImageUrl(generatedUrl);
      setPreviewObjectUrl("");
      setFileName("");
      setStatus({ type: "success", message: "Imagem gerada. Confira a prévia antes de publicar." });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Não foi possível gerar a imagem automaticamente. Você pode tentar novamente ou publicar sem imagem.",
      });
    } finally {
      setGeneratingImage(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (!name.trim() || !trimestre || !semana || !tipo) {
      setStatus({
        type: "error",
        message: "Preencha nome, trimestre, semana e tipo de refeição.",
      });
      return;
    }

    setSaving(true);

    try {
      await api.post("/refeicao", {
        name: name.trim(),
        description: description.trim(),
        dayWeek: "",
        calories: Number(calories) || 0,
        imageUrl: imageUrl.trim(),
        trimestre: Number(trimestre),
        semana: Number(semana),
        tipo,
      });


      setStatus({ type: "success", message: "Comida publicada no cardápio." });
      setName("");
      setDescription("");
      setTrimestre(2);
      setSemana(4);
      setTipo("ALMOCO");
      setCalories("");
      setImageUrl("");
      setPreviewObjectUrl("");
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
            <p>Cadastre o item por trimestre, semana e tipo de refeição.</p>
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
              <span>Trimestre</span>
              <select
                value={trimestre}
                onChange={(event) => setTrimestre(Number(event.target.value))}
              >
                {TRIMESTERS.map((item) => (
                  <option key={item} value={item}>
                    {item}º trimestre
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Semana</span>
              <input
                type="number"
                min="1"
                max="60"
                value={semana}
                onChange={(event) => setSemana(event.target.value)}
                placeholder="4"
              />
            </label>
          </div>

          <div className="admin-grid">
            <label className="admin-field">
              <span>Tipo de refeição</span>
              <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
                {MEAL_TYPES.map((mealType) => (
                  <option key={mealType.key} value={mealType.key}>
                    {mealType.label}
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
              value={imageUrl}
              onChange={(event) => {
                setImageUrl(event.target.value);
                setPreviewObjectUrl("");
                setFileName("");
              }}
              placeholder="https://... ou caminho da imagem"
            />
          </label>

          <button
            className="admin-generate"
            type="button"
            disabled={generatingImage || !name.trim()}
            onClick={handleGenerateImage}
          >
            {generatingImage ? "Gerando imagem..." : imageUrl ? "Gerar novamente" : "Gerar imagem"}
          </button>

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
            <span>Semana {preview.semana} · {preview.trimestre}º trimestre</span>
          </div>
          <div className="admin-preview-body">
            <p className="admin-preview-label">Prévia no cardápio</p>
            <h2>{preview.name}</h2>
            <p>{preview.description}</p>
            <div className="admin-preview-meta">
              <span>{preview.calories} kcal</span>
              <span>{preview.tipoLabel}</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
