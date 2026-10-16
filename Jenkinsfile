// Travel Bucket List - declarative pipeline (pipeline as code).
// Flow: Checkout -> Test -> Build Images -> Deploy -> Smoke Test
// A failing Test stage stops the pipeline BEFORE Deploy, so the running app keeps the previous version.

pipeline {
    agent any

    parameters {
        // Leave empty for a normal build. Fill in an old build number to redeploy that image tag (rollback).
        string(name: 'ROLLBACK_TAG', defaultValue: '', description: 'Build number to roll back to (empty = normal build)')
    }

    environment {
        COMPOSE_PROJECT_NAME = 'travelbucket'
        TAG = "${params.ROLLBACK_TAG ?: env.BUILD_NUMBER}"
    }

    triggers {
        // Primary trigger: GitHub webhook (needs the GitHub plugin + ngrok URL, see README).
        githubPush()
        // Fallback trigger: poll the repository every 5 minutes in case the webhook is unreachable.
        pollSCM('H/5 * * * *')
    }

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            when { expression { !params.ROLLBACK_TAG } }
            steps {
                // Tests run inside Docker via the "test" stage of each Dockerfile. A failing test fails the build here.
                sh 'docker build --target test -t travelbucket/destinations-api:test ./destinations-api'
                sh 'docker build --target test -t travelbucket/lookup-api:test ./lookup-api'
            }
        }

        stage('Build Images') {
            when { expression { !params.ROLLBACK_TAG } }
            steps {
                // Every image is tagged with the build number (TAG) so any build can be redeployed later.
                withEnvFile {
                    sh 'docker compose build'
                }
            }
        }

        stage('Deploy') {
            steps {
                withEnvFile {
                    sh 'docker compose up -d --no-build --remove-orphans'
                }
            }
        }

        stage('Smoke Test') {
            steps {
                withEnvFile {
                    sh './scripts/smoke-test.sh'
                }
            }
        }
    }

    post {
        success {
            echo "Build ${env.BUILD_NUMBER} OK - ${env.TAG} is live. Browse to http://localhost:8080"
        }
        failure {
            echo "Build ${env.BUILD_NUMBER} FAILED. Check the stage logs. If Deploy already ran, roll back with ROLLBACK_TAG=<previous build number>."
        }
        always {
            sh 'rm -f .env'
        }
    }
}

// The real .env lives in Jenkins Credentials (Secret file, id: travelbucket-env). It is copied in only while needed.
def withEnvFile(Closure body) {
    withCredentials([file(credentialsId: 'travelbucket-env', variable: 'ENV_FILE')]) {
        sh 'cp "$ENV_FILE" .env'
        body()
    }
}
