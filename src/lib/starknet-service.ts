import { Contract } from "starknet";

// These would be your actual contract addresses and ABIs in production
const SKILLSYNC_CONTRACT_ADDRESS = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

// Simplified ABI for the SkillSync Protocol contract
const SKILLSYNC_ABI = [
  {
    name: "register_dev",
    type: "function",
    inputs: [
      { name: "profile_uri", type: "felt" }
    ],
    outputs: []
  },
  {
    name: "post_job",
    type: "function",
    inputs: [
      { name: "job_uri", type: "felt" }
    ],
    outputs: []
  },
  {
    name: "get_developer_profile",
    type: "function",
    inputs: [
      { name: "developer_address", type: "felt" }
    ],
    outputs: [
      { name: "profile_uri", type: "felt" }
    ]
  },
  {
    name: "get_job_posting",
    type: "function",
    inputs: [
      { name: "job_id", type: "felt" }
    ],
    outputs: [
      { name: "job_uri", type: "felt" }
    ]
  },
  {
    name: "consent_to_profile_access",
    type: "function",
    inputs: [
      { name: "hr_address", type: "felt" },
      { name: "duration", type: "felt" }
    ],
    outputs: []
  },
  {
    name: "hire_developer",
    type: "function",
    inputs: [
      { name: "developer_address", type: "felt" },
      { name: "job_id", type: "felt" },
      { name: "company_name", type: "felt" },
      { name: "job_title", type: "felt" },
      { name: "uri", type: "felt" }
    ],
    outputs: []
  }
];

export class StarknetService {
  private contract: Contract | null = null;
  
  constructor(private account: any) {
    if (account) {
      this.initContract();
    }
  }
  
  private initContract() {
    if (!this.account) return;
    
    try {
      this.contract = new Contract(
        SKILLSYNC_ABI,
        SKILLSYNC_CONTRACT_ADDRESS,
        this.account
      );
    } catch (error) {
      console.error("Failed to initialize contract:", error);
    }
  }
  
  // Method to register a developer profile on the blockchain
  async registerDeveloperProfile(profileUri: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.contract) {
        this.initContract();
        
        if (!this.contract) {
          return { success: false, error: "Contract not initialized" };
        }
      }
      
      const response = await this.contract.invoke("register_dev", [profileUri]);
      return { success: true, txHash: response.transaction_hash };
    } catch (error: any) {
      console.error("Error registering developer profile:", error);
      return { success: false, error: error.message || "Transaction failed" };
    }
  }
  
  // Method to post a job on the blockchain
  async postJob(jobUri: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.contract) {
        this.initContract();
        
        if (!this.contract) {
          return { success: false, error: "Contract not initialized" };
        }
      }
      
      const response = await this.contract.invoke("post_job", [jobUri]);
      return { success: true, txHash: response.transaction_hash };
    } catch (error: any) {
      console.error("Error posting job:", error);
      return { success: false, error: error.message || "Transaction failed" };
    }
  }
  
  // Method to grant consent for profile access
  async grantProfileAccess(hrAddress: string, durationInDays: number): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.contract) {
        this.initContract();
        
        if (!this.contract) {
          return { success: false, error: "Contract not initialized" };
        }
      }
      
      const response = await this.contract.invoke("consent_to_profile_access", [hrAddress, durationInDays]);
      return { success: true, txHash: response.transaction_hash };
    } catch (error: any) {
      console.error("Error granting profile access:", error);
      return { success: false, error: error.message || "Transaction failed" };
    }
  }
  
  // Method to fetch a developer profile URI
  async getDeveloperProfile(developerAddress: string): Promise<{ success: boolean; profileUri?: string; error?: string }> {
    try {
      if (!this.contract) {
        this.initContract();
        
        if (!this.contract) {
          return { success: false, error: "Contract not initialized" };
        }
      }
      
      const response = await this.contract.call("get_developer_profile", [developerAddress]);
      return { success: true, profileUri: response.profile_uri };
    } catch (error: any) {
      console.error("Error fetching developer profile:", error);
      return { success: false, error: error.message || "Call failed" };
    }
  }
  
  // Method to fetch a job posting URI
  async getJobPosting(jobId: string): Promise<{ success: boolean; jobUri?: string; error?: string }> {
    try {
      if (!this.contract) {
        this.initContract();
        
        if (!this.contract) {
          return { success: false, error: "Contract not initialized" };
        }
      }
      
      const response = await this.contract.call("get_job_posting", [jobId]);
      return { success: true, jobUri: response.job_uri };
    } catch (error: any) {
      console.error("Error fetching job posting:", error);
      return { success: false, error: error.message || "Call failed" };
    }
  }

  // Method to mint a hire NFT on the blockchain
  async hireDeveloper(
    developerAddress: string,
    jobId: string,
    companyName: string,
    jobTitle: string,
    uri: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.contract) {
        this.initContract();
        if (!this.contract) return { success: false, error: "Contract not initialized" };
      }
      const response = await this.contract.invoke("hire_developer", [
        developerAddress,
        jobId,
        companyName,
        jobTitle,
        uri
      ]);
      return { success: true, txHash: response.transaction_hash };
    } catch (error: any) {
      console.error("Error minting hire NFT:", error);
      return { success: false, error: error.message || "Transaction failed" };
    }
  }
}