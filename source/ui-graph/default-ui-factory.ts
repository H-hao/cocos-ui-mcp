import { UIGraphNode, UIValidationWarning } from './types';

export interface DefaultUINodeResult {
    node: UIGraphNode;
    warnings: UIValidationWarning[];
}

const defaultChildren: Record<string, UIGraphNode[]> = {
    Toggle: [{ name: 'CheckMark', factory: 'Sprite' }],
    Slider: [{ name: 'Background', factory: 'Sprite' }, { name: 'Fill Area', factory: 'Node', children: [{ name: 'Fill', factory: 'Sprite' }] }, { name: 'Handle Slide Area', factory: 'Node', children: [{ name: 'Handle', factory: 'Sprite' }] }],
    ScrollView: [{ name: 'View', factory: 'Node', components: [{ type: 'Mask' }], children: [{ name: 'Content', factory: 'Node' }] }],
    PageView: [{ name: 'View', factory: 'Node', children: [{ name: 'Content', factory: 'Node' }] }],
    PageViewIndicator: [{ name: 'Indicators', factory: 'Node' }],
    ProgressBar: [{ name: 'Background', factory: 'Sprite' }, { name: 'Bar', factory: 'Sprite' }]
};

const defaultComponents: Record<string, string[]> = {
    Node: ['UITransform'],
    Sprite: ['UITransform', 'Sprite'],
    Label: ['UITransform', 'Label'],
    Button: ['UITransform', 'Sprite', 'Button'],
    Toggle: ['UITransform', 'Toggle'],
    Slider: ['UITransform', 'Slider'],
    ScrollView: ['UITransform', 'ScrollView', 'Mask'],
    PageView: ['UITransform', 'PageView'],
    PageViewIndicator: ['UITransform', 'PageViewIndicator'],
    ProgressBar: ['UITransform', 'ProgressBar']
};

export function createDefaultUINode(factory: string, options: Partial<UIGraphNode> = {}): DefaultUINodeResult {
    const node: UIGraphNode = {
        name: options.name || factory,
        factory,
        ...options,
        components: mergeComponents(defaultComponents[factory] || ['UITransform'], options.components || []),
        children: [...(defaultChildren[factory] || []), ...(options.children || [])]
    };
    return {
        node,
        warnings: [{ code: 'FALLBACK_DEFAULT_UI_FACTORY', path: '$.factory', message: `Used UI Graph fallback structure for ${factory}.`, suggestion: 'Verify generated hierarchy in Cocos Creator 3.8.x.' }]
    };
}

function mergeComponents(defaultTypes: string[], overrides: any[]) {
    const byType = new Map(defaultTypes.map((type) => [type, { type, props: {} }]));
    for (const component of overrides) {
        const current = byType.get(component.type) || { type: component.type, props: {} };
        byType.set(component.type, { ...current, ...component, props: { ...(current as any).props, ...(component.props || {}) } });
    }
    return Array.from(byType.values());
}
