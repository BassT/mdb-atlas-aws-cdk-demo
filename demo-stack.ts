import { CfnCluster } from "@mongodbatlas-awscdk/cluster";
import { CfnDatabaseUser } from "@mongodbatlas-awscdk/database-user";
import { CfnNetworkContainer } from "@mongodbatlas-awscdk/network-container";
import { CfnNetworkPeering } from "@mongodbatlas-awscdk/network-peering";
import { CfnProject } from "@mongodbatlas-awscdk/project";
import { CfnProjectIpAccessList } from "@mongodbatlas-awscdk/project-ip-access-list";
import {
  CfnTypeActivation,
  NestedStack,
  NestedStackProps,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import {
  CompositePrincipal,
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

const REGION = "eu-west-1";
const ATLAS_ORG_ID = "{{ATLAS_ORG_ID}}";
const VPC = {
  id: "{{AWS_VPC_ID}}  ",
  cidrBlock: "10.0.0.0/24",
  accountId: "{{AWS_ACCOUNT_ID}}",
};

export class DemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const prerequisitesStack = new PrerequisitesStack(
      this,
      "PrerequisitesStack"
    );
    const projectStack = new ProjectStack(this, "ProjectStack");
    new ClusterStack(this, "ClusterStack", {
      projectId: projectStack.atlasProject.attrId,
    });

    projectStack.addDependency(prerequisitesStack);
  }
}

class PrerequisitesStack extends NestedStack {
  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    // execution role
    // https://github.com/mongodb/mongodbatlas-cloudformation-resources/blob/master/examples/execution-role.yaml
    const executionRole = new Role(this, "DemoStackMongoDBAtlasExecutionRole", {
      roleName: "DemoStackMongoDBAtlasExecutionRole",
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("cloudformation.amazonaws.com"),
        new ServicePrincipal("resources.cloudformation.amazonaws.com"),
        new ServicePrincipal("lambda.amazonaws.com")
      ),
      inlinePolicies: {
        ResourceTypePolicy: new PolicyDocument({
          assignSids: true,
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "secretsmanager:CreateSecret",
                "secretsmanager:CreateSecretInput",
                "secretsmanager:DescribeSecret",
                "secretsmanager:GetSecretValue",
                "secretsmanager:PutSecretValue",
                "secretsmanager:UpdateSecretVersionStage",
                "ec2:CreateVpcEndpoint",
                "ec2:DeleteVpcEndpoints",
                "cloudformation:CreateResource",
                "cloudformation:DeleteResource",
                "cloudformation:GetResource",
                "cloudformation:GetResourceRequestStatus",
                "cloudformation:ListResources",
                "cloudformation:UpdateResource",
                "iam:AttachRolePolicy",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:GetRole",
                "iam:GetRolePolicy",
                "iam:ListAttachedRolePolicies",
                "iam:ListRolePolicies",
                "iam:PutRolePolicy",
              ],
              resources: ["*"],
            }),
          ],
        }),
      },
    });

    // extensions
    [
      CfnProject.CFN_RESOURCE_TYPE_NAME,
      CfnDatabaseUser.CFN_RESOURCE_TYPE_NAME,
      CfnProjectIpAccessList.CFN_RESOURCE_TYPE_NAME,
      CfnCluster.CFN_RESOURCE_TYPE_NAME,
      CfnNetworkContainer.CFN_RESOURCE_TYPE_NAME,
      CfnNetworkPeering.CFN_RESOURCE_TYPE_NAME,
    ]
      .map((type) => type.replace(/::/g, "-"))
      .map(
        (type) =>
          new CfnTypeActivation(this, `DemoStackTypeActiviation${type}`, {
            publicTypeArn: `arn:aws:cloudformation:${REGION}::type/resource/bb989456c78c398a858fef18f2ca1bfc1fbba082/${type}`,
            executionRoleArn: executionRole.roleArn,
          })
      );
  }
}

class ProjectStack extends NestedStack {
  atlasProject: CfnProject;
  networkContainer: CfnNetworkContainer;

  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    this.atlasProject = new CfnProject(this, "DemoStackAtlasProject", {
      name: "Demo",
      orgId: ATLAS_ORG_ID,
    });

    new CfnDatabaseUser(this, "DemoStackAtlasDatabaseUser", {
      databaseName: "admin",
      projectId: this.atlasProject.attrId,
      username: "test",
      password: "{{DB_PASSWORD}}",
      roles: [
        {
          databaseName: "admin",
          roleName: "readWriteAnyDatabase",
        },
      ],
    });

    new CfnProjectIpAccessList(this, "DemoStackAtlasProjectIpAccessList", {
      projectId: this.atlasProject.attrId,
      accessList: [{ cidrBlock: "0.0.0.0/0" }],
    });

    this.networkContainer = new CfnNetworkContainer(
      this,
      "DemoStackAtlasNetworkContainer",
      {
        atlasCidrBlock: "192.168.248.0/21",
        projectId: this.atlasProject.attrId,
        regionName: REGION.replace(/-/g, "_").toUpperCase(),
      }
    );

    new CfnNetworkPeering(this, "DemoStackAtlasNetworkPeering", {
      containerId: this.networkContainer.attrId,
      projectId: this.atlasProject.attrId,
      vpcId: VPC.id,
      accepterRegionName: REGION,
      awsAccountId: VPC.accountId,
      routeTableCidrBlock: VPC.cidrBlock,
    });
  }
}

class ClusterStack extends NestedStack {
  constructor(
    scope: Construct,
    id: string,
    props?: NestedStackProps & { projectId: string }
  ) {
    super(scope, id, props);

    const projectId = props?.projectId;
    if (!projectId) {
      throw new Error("Missing Atlas project id");
    }

    new CfnCluster(this, "DemoStackAtlasCluster", {
      projectId,
      name: "Demo",
      clusterType: "REPLICASET",
      replicationSpecs: [
        {
          advancedRegionConfigs: [
            {
              regionName: REGION.replace(/-/g, "_").toUpperCase(),
              priority: 7,
              electableSpecs: {
                instanceSize: "M10",
                nodeCount: 3,
              },
            },
          ],
        },
      ],
    });
  }
}
