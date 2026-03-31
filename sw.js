const CACHE_NAME = 'granja-pro-v1';

// Arquivos críticos para o app funcionar offline
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// 1. Instalação: Salva os arquivos essenciais no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache aberto e arquivos sendo armazenados...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Força o Service Worker atual a se tornar ativo imediatamente
  self.skipWaiting();
});

// 2. Ativação: Limpa caches antigos de versões anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Estratégia de busca (Fetch): Tenta a internet primeiro
self.addEventListener('fetch', (event) => {
  // Ignora requisições para a API do Google Sheets (deve ser sempre online)
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a rede responder, clona a resposta e guarda no cache
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // Se a internet falhar (offline), tenta buscar no cache
        return caches.match(event.request);
      })
  );
});

