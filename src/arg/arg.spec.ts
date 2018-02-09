
import { Arg, getArgsMetaObjectMap, ArgsMetaObjectMap } from './arg';
import { ObjectDefinition } from '../object';
import { getMetaObject, ID } from '../shared';


describe( '@Arg decorator', () => {

    @ObjectDefinition()
    class TypeDef1 { };

    class TypeA {
        fieldA(
            src: any,
            @Arg() arg1: number,
            @Arg() arg2: boolean,
            @Arg() arg3: string,
            @Arg( { type: 'ID' } ) arg4: string,
            @Arg( { type: 'ID' } ) arg5: string[],
            @Arg( ) arg6: TypeDef1,
            @Arg( { type: TypeDef1 } ) arg7: TypeDef1[],
            @Arg( { type: ID }) arg8: ID
        ) { }
    }

    let mo: ArgsMetaObjectMap;

    beforeEach( () => {
        mo = getArgsMetaObjectMap( TypeA );
    } )
    it( 'should add args map metadata', () => {
        expect( mo ).not.toBeNull();
        expect( mo.fieldA ).not.toBeUndefined();
        expect( mo ).toHaveProperty( 'fieldA' );
    } )

    it( 'should set the correct metadata for number', () => {
        expect( mo.fieldA ).toHaveProperty( 'arg1' );
        expect( mo.fieldA.arg1.index ).toBe( 1 );
        expect( mo.fieldA.arg1.type ).toBe( 'Int' );
        expect( mo.fieldA.arg1.nullable ).toBe( false );
    } );

    it( 'should set the correct metadata for boolean', () => {
        expect( mo.fieldA ).toHaveProperty( 'arg2' );
        expect( mo.fieldA.arg2.index ).toBe( 2 );
        expect( mo.fieldA.arg2.type ).toBe( 'Boolean' );
        expect( mo.fieldA.arg2.nullable ).toBe( false );
    } );

    it( 'should set the correct metadata for string', () => {
        expect( mo.fieldA ).toHaveProperty( 'arg3' );
        expect( mo.fieldA.arg3.index ).toBe( 3 );
        expect( mo.fieldA.arg3.type ).toBe( 'String' );
        expect( mo.fieldA.arg3.nullable ).toBe( false );
    } );

    it( 'should set set correct type if overloaded', () => {
        expect( mo.fieldA ).toHaveProperty( 'arg4' );
        expect( mo.fieldA.arg4.index ).toBe( 4 );
        expect( mo.fieldA.arg4.type ).toBe( 'ID' );
        expect( mo.fieldA.arg4.nullable ).toBe( false );
    } );

    it( 'should set set correct type for list', () => {
        expect( mo.fieldA ).toHaveProperty( 'arg5' );
        expect( mo.fieldA.arg5.index ).toBe( 5 );
        expect( mo.fieldA.arg4.type ).toBe( 'ID' );
        expect( mo.fieldA.arg5.nullable ).toBe( false );
        expect( mo.fieldA.arg5.list ).toBe( true );
    } );

    it( 'should throw if arg is list and type was not explicitly specified', () => {
        expect( () => {
            class TypeB {
                fieldA(
                    src: any,
                    @Arg() arg1: number[]
                ) { }
            }
        } ).toThrowError();
    } );

    it( 'should correclty resolve type when using Class as an implicit type', () => {
        expect( mo.fieldA ).toHaveProperty( 'arg6' );
        expect( mo.fieldA.arg6.index ).toBe( 6 );
        expect( mo.fieldA.arg6.type ).toBe( getMetaObject(TypeDef1).name );
        expect( mo.fieldA.arg6.nullable ).toBe( false );
        expect( mo.fieldA.arg6.list ).toBe( false );
    } );

    it( 'should correclty resolve type when using Class as an explicit type', () => {
        expect( mo.fieldA ).toHaveProperty( 'arg7' );
        expect( mo.fieldA.arg7.index ).toBe( 7 );
        expect( mo.fieldA.arg7.type ).toBe( getMetaObject(TypeDef1).name );
        expect( mo.fieldA.arg7.nullable ).toBe( false );
        expect( mo.fieldA.arg7.list ).toBe( true );
    } );

    it( 'should correclty resolve type when using AeroGraphQL core Types as explicit type', () => {
        expect( mo.fieldA ).toHaveProperty( 'arg8' );
        expect( mo.fieldA.arg8.index ).toBe( 8 );
        expect( mo.fieldA.arg8.type ).toBe( 'ID' );
        expect( mo.fieldA.arg8.nullable ).toBe( false );
        expect( mo.fieldA.arg8.list ).toBe( false );
    } );
} );
