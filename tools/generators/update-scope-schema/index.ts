import { Tree, formatFiles, updateJson, readJson, NxJsonConfiguration } from '@nrwl/devkit';

export default async function (host: Tree) {
  const nxContent = readJson<NxJsonConfiguration>(host, 'nx.json');
  const scopes = getScopes(nxContent);
  await updateJson(host, 'tools/generators/util-lib/schema.json', json => {
    json.properties.directory['x-prompt'].items = scopes.map(scope => ({
      value: scope,
      label: `${scope} scope`
    }));
    json.properties.directory.enum = scopes;
    return json;
  });
  const indexContent = host.read('tools/generators/util-lib/index.ts', 'utf-8');
  const newContent = replaceScopes(indexContent, scopes);
  host.write('tools/generators/util-lib/index.ts', newContent);
  await addMissingScope(host);
  await formatFiles(host);
}

async function addMissingScope(host: Tree) {
  await updateJson<NxJsonConfiguration>(host, 'nx.json', json => {
    Object.keys(json.projects).forEach(projectName => {
      if (!json.projects[projectName].tags.some(tag => tag.startsWith('scope:'))) {
        const scope = projectName.split('-')[0];
        json.projects[projectName].tags.push(`scope:${scope}`)
      }
    });

    return json;
  });
}

function replaceScopes(content: string, scopes: string[]): string {
  const joinScopes = scopes.map(s => `'${s}'`).join(' | ');
  const PATTERN = /interface Schema \{\n.*\n.*\n\}/gm;
  return content.replace(PATTERN,
    `interface Schema {
  name: string;
  directory: ${joinScopes};
}`
  );
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
