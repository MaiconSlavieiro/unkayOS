export default async function loadJSON(path) {
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