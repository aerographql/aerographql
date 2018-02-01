export const META_KEY_METAOBJECT_TYPE = "dtmb:type";
export const META_KEY_METAOBJECT = "dtmb:metadata";
export const META_KEY_ARGS_MAP = "dtmb:argsmap";
export const META_KEY_RESOLVERS_MAP = "dtmb:fields:implementation";
export const META_KEY_FIELDS_MAP = "dtmb:fields:definition";
export const META_KEY_TOKEN = "dtmb:token_";
export const META_KEY_COLLECTION = "dtmb:collection";

export const META_KEY_DESIGN_PARAMSTYPES = "design:paramtypes";
export const META_KEY_DESIGN_TYPE = "design:type";

export enum METAOBJECT_TYPES {
    interface = 'Interface',
    inputObject = 'InputObject',
    scalar = 'Scalar',
    objectDefinition = 'ObjectDefinition',
    objectImplementation = 'ObjectImplementation',
    schema = 'Schema',
    middleware = 'Middleware',
    notAnnotated = 'NotAnnotated'
}

export interface MetaObject {
    name: string
}

export function getMetaObject<T = MetaObject>( target: any, type: METAOBJECT_TYPES = null ): T {
    if ( type ) {
        if ( isOfMetaObjectType( target, METAOBJECT_TYPES.notAnnotated ) ) {
            throw new Error( `"${target.name}" does not seam to be correctly annotated` );
        }
        if ( !isOfMetaObjectType( target, type ) ) {
            throw new Error( `"${target.name}" (of type "${getMetaObjectType( target )}") is not of type "${type}"` );
        }
    }

    if ( Reflect.hasMetadata( META_KEY_METAOBJECT, target ) )
        return Reflect.getMetadata( META_KEY_METAOBJECT, target ) as T;
    return null;
}

export function getMetaObjectType( target: any ): METAOBJECT_TYPES {
    if ( Reflect.hasMetadata( META_KEY_METAOBJECT_TYPE, target ) )
        return Reflect.getMetadata( META_KEY_METAOBJECT_TYPE, target );
    return METAOBJECT_TYPES.notAnnotated;
}

export function isOfMetaObjectType( target: any, type: METAOBJECT_TYPES ) {
    let t = getMetaObjectType( target );
    if ( type === METAOBJECT_TYPES.notAnnotated )
        return t === undefined;

    return t === type;
}
