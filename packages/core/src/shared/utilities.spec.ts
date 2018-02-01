import 'reflect-metadata';
import { getFunctionParametersName } from './utilities';

let f1 = function ( p1: any, p2: any, p3: any ) { };
let f2 = function () { };

describe( 'getFunctionParametersName', () => {
    it( 'should extract correct parameter name', () => {
        expect( getFunctionParametersName( f1 ) ).toEqual( [ 'p1', 'p2', 'p3' ] )
        expect( getFunctionParametersName( f2 ) ).toEqual( [] )
    } );
} );
