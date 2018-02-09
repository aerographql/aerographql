/**
 * Check whether an input object is a Promise or not
 * @param obj 
 */
export let isPromise = function ( obj: any ): obj is Promise<any> {
    return !!obj && ( typeof obj === 'object' || typeof obj === 'function' ) && typeof obj.then === 'function';
};

/** 
 * Define and async functions
*/
export type AscynFunction<T> = ( ...args: any[] ) => Promise<T>;

/**
 * Execute a list of async function sequentially:
 * Run the first function, wait for the promise it return to resolve and then run the secnd one.
 * @param funcs List of function
 * @param params parameters passed to each async function
 */
export async function executeAsyncFunctionSequentialy<T>( funcs: AscynFunction<T>[], params: any[] = [] ) {
    return funcs.reduce( ( promise, func ) => {
        return promise.then( results => {
            return func( ...params ).then( result => {
                return results.concat( result )
            } )
        } )
    }, Promise.resolve( [] ) );
}

export let convertTypeFromTsToGraphQL = function ( ts: string ) {
    if ( ts === 'Number' ) {
        return 'Int'
    }
    else if ( ts === 'String' ) {
        return 'String'
    }
    else if ( ts === 'Boolean' ) {
        return 'Boolean'
    }

    return ts;
}

export let deduplicateArray = function ( arr: any[] ) {
    let s = new Set( arr );
    let it = s.values();
    return Array.from( it );
}

export function ensureMetadata<T>( key: string, target: any, defaultValue: any ) {
    if ( !Reflect.hasMetadata( key, target ) ) {
        Reflect.defineMetadata( key, defaultValue, target );
    }
    return Reflect.getMetadata( key, target ) as T;
}


/**
 * Parse a function object and return a list of each parameter's name
 * @param func The function to examine
 */
export function getFunctionParametersName( func: Function ) {
    if ( typeof func !== 'function' )
        return [];
        
    // First match everything inside the function argument parens.
    let funStr = func.toString();
    let params = funStr.slice( funStr.indexOf( '(' ) + 1, funStr.indexOf( ')' ) ).match( /([^\s,]+)/g );
    if ( !params )
        params = [];

    return params;
}



export class ID extends String {

}

export class Float extends Number {

}

export class Int extends Number {

}
