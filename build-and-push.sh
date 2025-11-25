#!/bin/bash
# Build and push Archive Resurrection Docker image

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-your-dockerhub-username}"
IMAGE_NAME="archive-resurrection"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "🏗️  Building Archive Resurrection Docker image..."
docker build -t $DOCKER_USERNAME/$IMAGE_NAME:$IMAGE_TAG .

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"

    read -p "Push to Docker Hub? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Pushing to Docker Hub..."
        docker push $DOCKER_USERNAME/$IMAGE_NAME:$IMAGE_TAG

        if [ $? -eq 0 ]; then
            echo "✅ Successfully pushed to $DOCKER_USERNAME/$IMAGE_NAME:$IMAGE_TAG"
            echo ""
            echo "📝 Next steps for TrueNAS deployment:"
            echo "   1. Update your TrueNAS app to use: $DOCKER_USERNAME/$IMAGE_NAME:$IMAGE_TAG"
            echo "   2. See TRUENAS-DEPLOYMENT.md for detailed instructions"
        else
            echo "❌ Push failed"
            exit 1
        fi
    fi
else
    echo "❌ Build failed"
    exit 1
fi
