export const WEEK_ANCHOR = {
  date: "2026-08-24",
  trimestre: 2,
  semana: 4,
};

export function getCurrentWeekInfo(now = new Date()) {
  const anchor = new Date(`${WEEK_ANCHOR.date}T00:00:00`);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffWeeks = Math.max(0, Math.floor((now - anchor) / msPerWeek));

  return {
    trimestre: WEEK_ANCHOR.trimestre,
    semana: WEEK_ANCHOR.semana + diffWeeks,
  };
}

export function sameWeek(refeicao, week) {
  return Number(refeicao.trimestre) === Number(week.trimestre)
    && Number(refeicao.semana) === Number(week.semana);
}

export function shiftWeek(week, delta) {
  const nextSemana = Math.min(60, Math.max(1, Number(week.semana) + delta));
  return {
    trimestre: Number(week.trimestre),
    semana: nextSemana,
  };
}
