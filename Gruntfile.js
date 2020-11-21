module.exports = function (grunt) {

    // Sonar allows alphanumeric characters, '-', '_', '.' and ':', with at least one non-digit.
    function complyToSonarConvention(key) {
        return key.replace('@', '').replace('/', ':');
    }

    const packageContent = grunt.file.readJSON('package.json');
    
    grunt.initConfig({
        clean: {
            files: ['target']
        },
        ts: {
            default: {
                tsconfig: './tsconfig.json'
            }
        },
        tslint: {
            options: {
                configuration: "./tslint.json",
                force: false,
                fix: false,
            },
            files: {
                src: ['src/**/*.ts', 'test/**/*.ts']
            }
        },
        run: {
            ts_unit: {
                cmd: 'npm',
                args: ['run', 'test']
            }
        },
        nyc: {
            cover: {
                options: {
                    include: ['src/**/*.ts'],
                    excludeNodeModules: true,
                    exclude: '*.test.*',
                    reporter: ['cobertura', 'text', 'lcov'],
                    reportDir: 'target/coverage',
                    tempDirectory: 'target/.nyc_output',
                    all: true,
                    checkCoverage: false,
                    perFile: true,
                    lines: 100,
                    statements: 100,
                    functions: 100,
                    branches: 100
                },
                cmd: false,
                args: [
                    'mocha',
                    '--reporter', 'mocha-junit-reporter',
                    '--reporter-options', 'mochaFile=target/junit-report.xml',
                    'test/**/*.test.ts'
                ]
            }
        },
        report: {
            options: {
                reporter: 'text-summary'
            }
        },
    });

    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-run');
    grunt.loadNpmTasks("grunt-tslint");
    grunt.loadNpmTasks('grunt-simple-nyc');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-sonar-runner');

    grunt.registerTask("lint", ["tslint"]);
    grunt.registerTask("unit_test", ["run:ts_unit"]);
    grunt.registerTask("cover", ["nyc"]);
    grunt.registerTask('sonar', ['clean', 'tslint', 'nyc']);

    grunt.registerTask("verify", ["unit_test", "tslint", "nyc"]);
};
