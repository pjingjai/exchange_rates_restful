type Rates = {
    [key: string]: number
}

export default interface File {
    rates: Rates
    base?: string
    date?: string
}