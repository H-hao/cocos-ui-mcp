"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUiGraphSkillVersionSmokeTests = runUiGraphSkillVersionSmokeTests;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const schema_1 = require("../ui-graph/schema");
const schema_hash_1 = require("../ui-graph/schema-hash");
function runUiGraphSkillVersionSmokeTests() {
    const payloadPath = path.join(process.cwd(), '.agents', 'skills', 'cocos-ui-graph', 'schemas', 'schema-hash-payload.json');
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
    const expectedPayload = {
        graph: schema_1.UI_GRAPH_SCHEMA_VERSION,
        patch: schema_1.UI_PATCH_SCHEMA_VERSION,
        skill: schema_1.UI_GRAPH_SKILL_VERSION,
        factories: schema_1.SUPPORTED_FACTORIES,
        operations: schema_1.SUPPORTED_OPERATIONS,
        components: schema_1.BUILTIN_COMPONENT_PROPS
    };
    return {
        supportedSkillVersion: schema_1.UI_GRAPH_SKILL_VERSION,
        schemaHash: (0, schema_hash_1.getSchemaHash)(),
        skillSchemaPayloadInSync: JSON.stringify(payload) === JSON.stringify(expectedPayload)
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktZ3JhcGgtc2tpbGwtdmVyc2lvbi10ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rlc3QvdWktZ3JhcGgtc2tpbGwtdmVyc2lvbi10ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBS0EsNEVBZ0JDO0FBckJELHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFDN0IsK0NBQWtMO0FBQ2xMLHlEQUF3RDtBQUV4RCxTQUFnQixnQ0FBZ0M7SUFDNUMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztJQUMzSCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDakUsTUFBTSxlQUFlLEdBQUc7UUFDcEIsS0FBSyxFQUFFLGdDQUF1QjtRQUM5QixLQUFLLEVBQUUsZ0NBQXVCO1FBQzlCLEtBQUssRUFBRSwrQkFBc0I7UUFDN0IsU0FBUyxFQUFFLDRCQUFtQjtRQUM5QixVQUFVLEVBQUUsNkJBQW9CO1FBQ2hDLFVBQVUsRUFBRSxnQ0FBdUI7S0FDdEMsQ0FBQztJQUNGLE9BQU87UUFDSCxxQkFBcUIsRUFBRSwrQkFBc0I7UUFDN0MsVUFBVSxFQUFFLElBQUEsMkJBQWEsR0FBRTtRQUMzQix3QkFBd0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDO0tBQ3hGLENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IEJVSUxUSU5fQ09NUE9ORU5UX1BST1BTLCBTVVBQT1JURURfRkFDVE9SSUVTLCBTVVBQT1JURURfT1BFUkFUSU9OUywgVUlfR1JBUEhfU0NIRU1BX1ZFUlNJT04sIFVJX0dSQVBIX1NLSUxMX1ZFUlNJT04sIFVJX1BBVENIX1NDSEVNQV9WRVJTSU9OIH0gZnJvbSAnLi4vdWktZ3JhcGgvc2NoZW1hJztcbmltcG9ydCB7IGdldFNjaGVtYUhhc2ggfSBmcm9tICcuLi91aS1ncmFwaC9zY2hlbWEtaGFzaCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBydW5VaUdyYXBoU2tpbGxWZXJzaW9uU21va2VUZXN0cygpIHtcbiAgICBjb25zdCBwYXlsb2FkUGF0aCA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnLmFnZW50cycsICdza2lsbHMnLCAnY29jb3MtdWktZ3JhcGgnLCAnc2NoZW1hcycsICdzY2hlbWEtaGFzaC1wYXlsb2FkLmpzb24nKTtcbiAgICBjb25zdCBwYXlsb2FkID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGF5bG9hZFBhdGgsICd1dGY4JykpO1xuICAgIGNvbnN0IGV4cGVjdGVkUGF5bG9hZCA9IHtcbiAgICAgICAgZ3JhcGg6IFVJX0dSQVBIX1NDSEVNQV9WRVJTSU9OLFxuICAgICAgICBwYXRjaDogVUlfUEFUQ0hfU0NIRU1BX1ZFUlNJT04sXG4gICAgICAgIHNraWxsOiBVSV9HUkFQSF9TS0lMTF9WRVJTSU9OLFxuICAgICAgICBmYWN0b3JpZXM6IFNVUFBPUlRFRF9GQUNUT1JJRVMsXG4gICAgICAgIG9wZXJhdGlvbnM6IFNVUFBPUlRFRF9PUEVSQVRJT05TLFxuICAgICAgICBjb21wb25lbnRzOiBCVUlMVElOX0NPTVBPTkVOVF9QUk9QU1xuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3VwcG9ydGVkU2tpbGxWZXJzaW9uOiBVSV9HUkFQSF9TS0lMTF9WRVJTSU9OLFxuICAgICAgICBzY2hlbWFIYXNoOiBnZXRTY2hlbWFIYXNoKCksXG4gICAgICAgIHNraWxsU2NoZW1hUGF5bG9hZEluU3luYzogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCkgPT09IEpTT04uc3RyaW5naWZ5KGV4cGVjdGVkUGF5bG9hZClcbiAgICB9O1xufVxuIl19