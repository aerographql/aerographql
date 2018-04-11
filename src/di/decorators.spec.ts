import { Inject, Injectable } from './decorators';
import { META_KEY_TOKEN } from '../shared/metaobject';
import { getMetadata } from '../shared/utilities';

@Injectable()
class Test1 {
    constructor( @Inject( 'token1' ) arg1: number, @Inject( 'token2' ) arg2: number ) {

    }
}

describe( '@Inject decorator', () => {
    it( 'should create the right metadata', () => {
        let test = new Test1( 28, 25 );
        expect( getMetadata( META_KEY_TOKEN + 0, test.constructor ) ).toBe( 'token1' );
        expect( getMetadata( META_KEY_TOKEN + 1, test.constructor ) ).toBe( 'token2' );
    } );
} );
