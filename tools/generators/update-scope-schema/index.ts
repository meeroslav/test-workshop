import { Tree, formatFiles, updateJson, readJson } from '@nrwl/devkit';

export default async function (host: Tree) {
  const nxContent = readJson(host, 'nx.json');
  const scopes = getScopes(nxContent);
  await updateJson(host, 'tools/generators/util-lib/schema.json', json => {
    json.properties.directory['x-prompt'].items = scopes.map(scope => ({
      value: scope,
      label: `${scope} scope`
    }));
    return json;
  });
  await formatFiles(host);
}

function getScopes(nxJson: any) {
  const projects: any[] = Object.values(nxJson.projects);
  const allScopes: string[] = projects
    .map(project => project.tags
      // take only those that point to scope
      .filter((tag: string) => tag.startsWith('scope:'))
    )
    // flatten the array
    .reduce((acc, tags) => [...acc, ...tags], [])
    // remove prefix `scope:`
    .map((scope: string) => scope.slice(6));
  // remove duplicates
  return [...new Set(allScopes)];
}
