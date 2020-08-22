export interface IMeasurement { [key: string]: number[] }

export interface IParserResult {
    result: IMeasurement,
    t0: number
}