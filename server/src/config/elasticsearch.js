import { Client } from '@elastic/elasticsearch';

let esClient = null;

export const initElasticsearch = async () => {
  const node = process.env.ELASTICSEARCH_URL;

  if (node) {
    try {
      esClient = new Client({ node });
      const ping = await esClient.ping();
      console.log(`[Elasticsearch] Connected successfully to ${node} (ping: ${ping})`);
      await ensureProductIndex();
    } catch (err) {
      console.warn(`[Elasticsearch Notice] Could not connect to cluster: ${err.message}. Using built-in search engine adapter.`);
      esClient = null;
    }
  } else {
    console.log('[Elasticsearch] No ELASTICSEARCH_URL defined. Initialized with Zero-Cost Search Engine Adapter.');
  }

  return esClient;
};

export const getElasticClient = () => esClient;

// Ensure index exists with proper mappings
export const ensureProductIndex = async () => {
  if (!esClient) return;
  const index = 'products';
  try {
    const exists = await esClient.indices.exists({ index });
    if (!exists) {
      await esClient.indices.create({
        index,
        body: {
          mappings: {
            properties: {
              title: { type: 'text', analyzer: 'standard' },
              description: { type: 'text' },
              category: { type: 'keyword' },
              brand: { type: 'keyword' },
              price: { type: 'float' },
              ratingAverage: { type: 'float' },
              vendorId: { type: 'keyword' },
              vendorName: { type: 'text' },
              stock: { type: 'integer' }
            }
          }
        }
      });
      console.log('[Elasticsearch] Products index created with faceted mapping.');
    }
  } catch (err) {
    console.warn(`[Elasticsearch Index Notice] ${err.message}`);
  }
};
