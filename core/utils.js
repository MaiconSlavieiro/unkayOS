export const convertPx2 = {
  vh: function (px) {
    px = parseFloat(px);
    const wh = window.innerHeight;
    return (px * 100) / wh + "vh";
  },

  vw: function (px) {
    px = parseFloat(px);
    const ww = window.innerWidth;
    return (px * 100) / ww + "vw";
  }
};

export async function loadJSON(path) {
  try {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`Erro ao carregar JSON: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Houve um problema ao carregar o JSON:', error);
    throw error; // Propaga o erro
  }
}


