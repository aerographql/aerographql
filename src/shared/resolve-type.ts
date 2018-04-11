import { GraphQLString, GraphQLFloat, GraphQLInt, GraphQLID, GraphQLBoolean } from 'graphql';

import { deduplicateArray } from './utilities';
import { Injector } from '../di/injector';
import { getMetaObject, META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES, getMetaObjectType } from './metaobject';
import { FieldMetaObject } from '../field/field';
import { ObjectDefinitionMetaObject } from '../object/object-definition';
import { ObjectImplementationMetaObject } from '../object/object-implementation';
import { BaseSchema } from '../schema/base-schema';

/** 
 * Default method to resolve type for union and interface is to check the metadata available on the value conestructor, if any.
 * If this approach is not enough, you can enhance it by providing a custom ResolveTypeFunction, which must
 * provide the right analyze and return the right type name
*/
export type ResolveTypeFunction = ( value: any, context: any, info: any ) => string;

/**
 * Default resolveType for Interface and Union.
 * 
 * @param customResolveType 
 * @param potentialTypes 
 */
export let createdResolveType = ( name: string, customResolveType: ResolveTypeFunction, potentialTypes: Function[] ) : ResolveTypeFunction => {

    let types: { [ key: string ]: { [ key: string ]: FieldMetaObject } } = {};

    // Create a map associatin each type with a list of field
    deduplicateArray( potentialTypes ).forEach( type => {
        let name: string;
        let od = getMetaObject<ObjectDefinitionMetaObject>( type );
        if ( od ) {
            types[ od.name ] = Object.assign( {}, types[ od.name ], od.fields )
        }
        let oi = getMetaObject<ObjectImplementationMetaObject>( type );
        if ( oi ) {
            types[ oi.name ] = Object.assign( {}, types[ oi.name ], oi.resolvers )
        }
    } );

    // Build a map that associate a Type name in potentialTypes to a field name present on this object
    // which is ONLY present in this object.
    // We can then later on use this 'unique' field as a descriminant to infer the type of a given object,
    // Just by checking if this field exist
    let discriminantMap: { [ key: string ]: string } = {};

    // For each types
    for ( let typeName in types ) {
        let type = types[ typeName ];
        // For each field in this object
        for ( let fieldName in type ) {
            // Check if this field is only present in this object.
            // If that's the case it could be considered as a discriminant to identify this perticular type of object
            let isDiscriminant = true;
            // For each other objects
            for ( let otherTypeName in types ) {
                if ( typeName === otherTypeName )
                    continue;

                let otherType = types[ otherTypeName ];
                for ( let otherTypeFieldName in otherType ) {
                    if ( otherTypeFieldName === fieldName ) {
                        isDiscriminant = false;
                        break;
                    }
                }
            }

            // If a discriminant field was found, store it for this type name and move to the others types
            if ( isDiscriminant ) {
                discriminantMap[ typeName ] = fieldName;
                break;
            }
        }
    }


    return ( value: any, context: any, info: any ) => {

        // If Object was builded using new operator on an annotated constructor, it fairly easy to find out it's type
        let p = getMetaObject( value.constructor );
        if ( p ) {
            return p.name;
        }

        // If object type cannot be resolved using metadata, check if there is a user provided __typename field on this object
        // that could tell us what's the type of thie object
        if ( value.__typename )
            return value.__typename;

        // If type still cannot be found, check if there is a user provided resolveType method
        if ( customResolveType )
            return customResolveType( value, context, info )
        else {
            // Otherwise 
            for ( let typeName in discriminantMap ) {
                let discriminantFieldName = discriminantMap[ typeName ];
                if ( discriminantFieldName && value[ discriminantFieldName ] !== undefined ) {
                    return typeName;
                }
            }
        }

        throw new Error( `AeroGraphQL was not able to resolve type "${name}", please specify a customResolveType callback` );
    }
}
