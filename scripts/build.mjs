import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const registry=JSON.parse(await fs.readFile('registry.json','utf8'));
if(registry.schemaVersion!==1||!Array.isArray(registry.plugins))throw Error('Invalid catalog');
await fs.mkdir('dist',{recursive:true});
const ids=new Set();
for(const plugin of registry.plugins){
 if(!/^[a-z][a-z0-9-]{0,63}$/.test(plugin.id)||ids.has(plugin.id))throw Error('Invalid or duplicate plugin');ids.add(plugin.id);
 if(!plugin.versions.some(v=>v.version===plugin.latest))throw Error('Missing latest version');
 for(const version of plugin.versions){
  if(!/^\d+\.\d+\.\d+$/.test(version.version))throw Error('Invalid version');
  const root=path.join('plugins',plugin.id,version.version);
  const manifest=JSON.parse(await fs.readFile(path.join(root,'plugin.json'),'utf8'));
  const backend=await fs.readFile(path.join(root,'backend.js'),'utf8');
  const digest=createHash('sha256').update(JSON.stringify(manifest)).update('\0').update(backend).digest('hex');
  if(manifest.id!==plugin.id||manifest.version!==version.version||version.digest!==digest)throw Error('Catalog does not match source: '+plugin.id);
  const file=`${plugin.id}-${version.version}.kairos-plugin.json`;
  await fs.writeFile(path.join('dist',file),JSON.stringify({format:1,manifest,backend,digest}));
  console.log(file+' '+digest);
 }
}
