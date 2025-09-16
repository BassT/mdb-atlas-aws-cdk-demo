# MongoDB Atlas AWS CDK Demo

This project demonstrates the use of AWS CDK (Cloud Development Kit) for automating the deployment of a MongoDB Atlas environment on AWS. It provisions the necessary AWS infrastructure and integrates with MongoDB Atlas using custom CloudFormation resources.

## Features

- **Automated AWS Infrastructure**: Uses AWS CDK (in TypeScript) to define and deploy all required AWS resources.
- **MongoDB Atlas Integration**: Provisions a MongoDB Atlas project, database user, IP access list, network container, and networking peering with AWS VPC.
- **Custom CloudFormation Resources**: Leverages the MongoDB Atlas CloudFormation resource types for seamless integration.
- **Role-Based Access Control**: Sets up IAM roles and policies required for the CloudFormation resources and Atlas providers.

## Stack Structure

- `PrerequisitesStack`: Sets up execution roles and activates required CloudFormation resource types for MongoDB Atlas.
- `ProjectStack`: Provisions the MongoDB Atlas project, users, access lists, and networking.
- `ClusterStack`: Creates a MongoDB Atlas cluster within the project.

## Usage

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Bootstrap your AWS environment (if not already done)**
   ```bash
   cdk bootstrap
   ```

3. **Deploy the stack**
   ```bash
   cdk deploy
   ```

4. **Cleanup**
   ```bash
   cdk destroy
   ```

## Requirements

- AWS Account with sufficient permissions
- MongoDB Atlas Organization ID
- Node.js and npm
- AWS CDK CLI

## Customization

Edit `demo-stack.ts` to update region, VPC, MongoDB Atlas organization ID, and resource configuration as needed.
