pipeline {
    agent {
        docker {
            image 'node:18-alpine'
        }
    }
    
    environment {
        MONGODB_URI = credentials('mongodb-uri')
        PORT = '3000'
    }
    
    stages {
        stage('Build') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh 'docker build --target production -t task-management-system --build-arg PORT=$PORT --build-arg NODE_ENV=production .'
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([string(credentialsId: 'docker-hub-password', variable: 'DOCKER_PASSWORD')]) {
                    sh 'echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin'
                    sh 'docker tag task-management-system $DOCKER_USERNAME/task-management-system'
                    sh 'docker push $DOCKER_USERNAME/task-management-system'
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
    }
}
