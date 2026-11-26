import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildOpenApiSpec } from '../src/config/openapiSpec';

const target = path.join(__dirname, '../src/config/openapi.json');
writeFileSync(target, `${JSON.stringify(buildOpenApiSpec(), null, 2)}\n`);
console.log(`OpenAPI gerado em ${path.relative(process.cwd(), target)}`);
