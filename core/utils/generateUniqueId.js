// Gera um ID único baseado em timestamp e número aleatório
export function generateUniqueId() {
    return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
} 