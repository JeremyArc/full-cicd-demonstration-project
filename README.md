# Full CI/CD Demonstration Project

This repository demonstrates a complete CI/CD pipeline setup using Github Action for CI integrated with Trivy scan, ArgoCD within EKS cluster to detect manifest file changes automatically and git-auto-commit Action for commit the image tag update in manifest file automatically.

# Table of Contents

- Prerequisites
- Architecture
- Preparation
- Implementation
- Clear resources

# Prerequisites

Before you begin, ensure you have the following installed:

- kubectl
- Helm
- AWS CLI
- AWS credential set on your local machine at ~/.aws/credential
- eksctl
- ArgoCD CLI
- A domain name for load balancer (recommend AWS Route53)

Additionally, you need an AWS account with the necessary permissions to create and manage EKS clusters and other associated resources.

# Architecture

This repository sets up the following architecture:

- Github Actions: For continuous integration and automation.
- [Trivy](https://github.com/aquasecurity/trivy-action): For scan software vulnerability.
- [git-auto-commit-action](https://github.com/stefanzweifel/git-auto-commit-action): For github bot commit changes after update the image in manifest file after push image to ECR.
- Kubernetes (EKS): For deploying and managing containerized applications.
- Helm: For install nginx ingress controller.
- AWS EKS: Managed Kubernetes service on AWS.
- AWS ECR: Store Docker images.
- ArgoCD: For GitOps on EKS cluster.

# Preparation

## Step 1: [Create ECR](https://aws.amazon.com/th/free/?trk=3da0c7fb-0599-4e9f-a78c-2df84cba096e&sc_channel=ps&ef_id=:G:s&s_kwcid=AL!4422!10!71399764321874!71400310242997&msclkid=6cf7cd0a19c61f9bdcbfab8f4ae2ad44&all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc&awsf.Free%20Tier%20Types=*all&awsf.Free%20Tier%20Categories=*all)

## Step 2: Store AWS credential and ECR repository name within in this Github repository to allow Github Action to able to push image to ECR repository

- REPO_NAME: {aws-account-id}.dkr.ecr.{region}.amazonaws.com/{registry-name}
- AWS_ACCESS_KEY_ID:
- AWS_SECRET_ACCESS_KEY:

# Implementation

## Step 1: Clone the Repository

```bash
git clone https://github.com/JeremyArc/full-cicd-demonstration-project.git
cd full-cicd-demonstration-project
```

## Step 2: Create an EKS Cluster

```bash
eksctl create cluster \
--name dummy-cluster \
--region ap-southeast-1 \
--nodegroup-name linux-nodes \
--node-type t2.medium \
--nodes 2
```

## Step 3: Get the created cluster's credential (specific which cluster to work with)

```bash
eksctl utils write-kubeconfig --cluster dummy-cluster --region ap-southeast-1
```

## Step 4: Install ingress controller in EKS cluster

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace kube-system
```

## Step 5: Login to ECR registry and create a secret for ArgoCD application can use it as a secret when pull the image to `Deployment.yaml`

Create name space for application.

```bash
kubectl create namespace dummy
```

Login to ECR and create Docker config automatically.

```bash
aws ecr get-login-password --region <ECR-region> | docker login --username AWS --password-stdin <aws-user-id>.dkr.ecr.ap-<region>.amazonaws.com
```

Set current namespace.

```bash
kubectl config set-context $(kubectl config current-context) --namespace=dummy
```

Export `DOCKER_SECRET`.

```bash
DOCKER_SECRET=$(echo $HOME/.docker/config.json)
echo $DOCKER_SECRET
```

Create secret.

```bash
kubectl create secret generic jessada-full-cicd \
  --from-file=.dockerconfigjson=$DOCKER_SECRET \
  --type=kubernetes.io/dockerconfigjson
```

Review your secret.

```bash
kubectl get secret
```

## Step 6: Install ArgoCD in EKS cluster

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

## Step 7: Change the argocd-server service type to LoadBalancer

By default, the Argo CD API server is not exposed with an external IP.
```bash
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
```
Or you can forward port and access it via localhost:8080 

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

## Step 8: Login to ArgoCD UI using load balancer's DNS

- user: `admin`
- password: use this command to get default admin's password `argocd admin initial-password -n argocd`
- Remark: You should change password and delete this credential after the first login.

## Step 9: Apply ArgoCD application

Suppose you are on root folder

- Don't forget to replace `space-webhook-url` for `argocd-notification-secret.yaml` based on your use case

```bash
kubectl apply -f ./deployment/argocd/ -n argocd
```

## Step 10: Attach Ingress controller load balancer's DNS to Route53 A alias record

## Step 11: Create Github Webhook for ArgoCD application that allow ArgoCD immediately apply a manifest file as soon as it changed.

[How to setup Github Webhook to ArgoCD application Docs](https://argo-cd.readthedocs.io/en/stable/operator-manual/webhook/)

# Clear resources

If you need to remove all the resource, use this command 

```bash
eksctl delete cluster --name dummy-cluster --region ap-southeast-1
```
