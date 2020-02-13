module.exports = {
  "roots": [
    "<rootDir>/src",
    "<rootDir>/test"
  ],
  "transform": {
    "^.+\\.jsx?$": "babel-jest",
    "^.+\\.tsx?$": "ts-jest"
  },
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  }
}