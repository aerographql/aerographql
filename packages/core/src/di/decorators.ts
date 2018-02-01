import 'reflect-metadata';
import { META_KEY_TOKEN } from '../shared';

/**
 * Injectable decorator
 *
 * It's only goal is to force Typescript to generate reflection metadata,
 * used later to extract dependencies from ctr parameters
 */
export function Injectable() {

    return function ( constructor: any ) {
    }
}

/**
 * Inject decorator
 *
 * Allow to override the token name used by a dependency.
 * By default, the token name is derived from the constructor name of the dependency.
 * In certain case it's necessary to overide it.
 */
export function Inject( token: string ) {

    return function ( target: Object, key: string, index: number ) {

        // Add a special metadata to override token name if necessary
        Reflect.defineMetadata( META_KEY_TOKEN + index, token, target );
    }
}
