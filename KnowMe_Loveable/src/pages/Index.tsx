import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Upload, 
  FileText, 
  Calendar, 
  Users, 
  BarChart, 
  HelpCircle, 
  Settings,
  Clock,
  LogOut
} from "lucide-react";
import { Sidebar, SidebarItem, SidebarLogo, SidebarBottom } from "@/components/KnowMeSidebar";
import { FeatureCard, ChipButton } from "@/components/FeatureCard";
import { ChatInterface } from "@/components/ChatInterface";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  name: string;
  size: number;
  uploadedAt: Date;
}

const Index = () => {
  const [activeSection, setActiveSection] = useState("assistant");
  const [showWelcome, setShowWelcome] = useState(true);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleSendMessage = async (message: string) => {
    if (!isChatStarted) {
      setIsChatStarted(true);
      setShowWelcome(false);
    }
    
    setIsLoading(true);
    try {
      const response = await apiService.chat(message);
      return response;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const response = await apiService.uploadPdf(file);
      const newFile: UploadedFile = {
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
      };
      setUploadedFiles(prev => [...prev, newFile]);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const handleFileDelete = async (filename: string) => {
    try {
      await apiService.deletePdf(filename);
      setUploadedFiles(prev => prev.filter(file => file.name !== filename));
    } catch (error) {
      throw error;
    }
  };

  const handleQuestionClick = (question: string) => {
    handleSendMessage(question);
  };

  const sampleQuestions = {
    ask: [
      "What are the key objectives and deliverables of this project?",
      "How will tasks be assigned, and who is responsible for each one?"
    ],
    summarize: [
      "How can I communicate my points clearly and persuasively?",
      "Can you propose a new idea, or advocate for a change?"
    ],
    discover: [
      "What are the company's long-term goals and core values?",
      "What is our policy for remote work this year?"
    ]
  };

  return (
    <div className="min-h-screen bg-app-background">
      {/* Sidebar */}
      <Sidebar>
        <SidebarLogo>KnowMe</SidebarLogo>
        
        <nav className="space-y-2">
          <SidebarItem 
            isActive={activeSection === "dashboard"}
            onClick={() => setActiveSection("dashboard")}
          >
            <BarChart className="w-5 h-5" />
            Dashboard
          </SidebarItem>
          
          <SidebarItem 
            isActive={activeSection === "attendance"}
            onClick={() => setActiveSection("attendance")}
          >
            <Clock className="w-5 h-5" />
            Attendance
          </SidebarItem>
          
          <SidebarItem 
            isActive={activeSection === "leave"}
            onClick={() => setActiveSection("leave")}
          >
            <Calendar className="w-5 h-5" />
            Leave
          </SidebarItem>
          
          <SidebarItem 
            isActive={activeSection === "projects"}
            onClick={() => setActiveSection("projects")}
          >
            <FileText className="w-5 h-5" />
            Projects
          </SidebarItem>
          
          <SidebarItem 
            isActive={activeSection === "calendar"}
            onClick={() => setActiveSection("calendar")}
          >
            <Calendar className="w-5 h-5" />
            Calendar
          </SidebarItem>
          
          <SidebarItem 
            isActive={activeSection === "employees"}
            onClick={() => setActiveSection("employees")}
          >
            <Users className="w-5 h-5" />
            Employees
          </SidebarItem>
          
          <SidebarItem 
            isActive={activeSection === "message"}
            onClick={() => setActiveSection("message")}
            badge={6}
          >
            <MessageSquare className="w-5 h-5" />
            Message
          </SidebarItem>
          
          <SidebarItem 
            isActive={activeSection === "assistant"}
            onClick={() => setActiveSection("assistant")}
          >
            <MessageSquare className="w-5 h-5" />
            Assistant
          </SidebarItem>
          
          <SidebarItem 
            isActive={activeSection === "jobs"}
            onClick={() => setActiveSection("jobs")}
            badge={5}
          >
            <Upload className="w-5 h-5" />
            Jobs
          </SidebarItem>
          
          <SidebarItem 
            isActive={activeSection === "payroll"}
            onClick={() => setActiveSection("payroll")}
          >
            <BarChart className="w-5 h-5" />
            Payroll
          </SidebarItem>
          
          <SidebarItem 
            isActive={activeSection === "sales"}
            onClick={() => setActiveSection("sales")}
          >
            <BarChart className="w-5 h-5" />
            Sales
          </SidebarItem>
          
          <SidebarItem 
            isActive={activeSection === "reports"}
            onClick={() => setActiveSection("reports")}
            badge={2}
          >
            <FileText className="w-5 h-5" />
            Reports
          </SidebarItem>
          
          <SidebarItem 
            isActive={activeSection === "help"}
            onClick={() => setActiveSection("help")}
          >
            <HelpCircle className="w-5 h-5" />
            Help Center
          </SidebarItem>
          
          <SidebarItem 
            isActive={activeSection === "settings"}
            onClick={() => setActiveSection("settings")}
          >
            <Settings className="w-5 h-5" />
            Settings
          </SidebarItem>
        </nav>
        
        <SidebarBottom>
          <div className="flex items-center justify-between mb-4">
            <span className="text-primary-indigo font-medium">6h:29m</span>
            <span className="bg-primary-indigo text-white px-2 py-1 rounded text-sm">Busy</span>
          </div>
          <Button className="w-full bg-warm-orange hover:bg-warm-orange hover:bg-opacity-90 text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Check Out
          </Button>
        </SidebarBottom>
      </Sidebar>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="h-full bg-content-background rounded-tl-xl shadow-subtle m-4 ml-0 flex flex-col">
          {/* Header */}
          <header className="p-6 border-b border-border-light">
            <h1 className="text-2xl font-bold text-text-primary">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h1>
          </header>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            {activeSection === "assistant" && !isChatStarted && showWelcome && (
              <div className="flex-1 p-8">
                {/* Welcome Section */}
                <div className="max-w-4xl mx-auto text-center mb-12">
                  <h2 className="text-4xl font-bold text-text-primary mb-4">
                    How can I help you <span className="text-warm-orange">today?</span>
                  </h2>
                  <p className="text-text-secondary text-lg">
                    Ask questions, compose drafts & discover insights
                  </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
                  <FeatureCard
                    title="Ask Questions"
                    description="Get instant answers and insights based on your uploaded documents and conversation history."
                    accent="indigo"
                  >
                    {sampleQuestions.ask.map((question, index) => (
                      <ChipButton 
                        key={index} 
                        onClick={() => handleQuestionClick(question)}
                      >
                        {question}
                      </ChipButton>
                    ))}
                  </FeatureCard>

                  <FeatureCard
                    title="Summarize Questions"
                    description="Receive concise summaries and key takeaways from complex information and discussions."
                    accent="emerald"
                  >
                    {sampleQuestions.summarize.map((question, index) => (
                      <ChipButton 
                        key={index} 
                        onClick={() => handleQuestionClick(question)}
                      >
                        {question}
                      </ChipButton>
                    ))}
                  </FeatureCard>

                  <FeatureCard
                    title="Discover KnowMe"
                    description="Explore personalized recommendations and insights tailored to your specific needs and preferences."
                    accent="orange"
                  >
                    {sampleQuestions.discover.map((question, index) => (
                      <ChipButton 
                        key={index} 
                        onClick={() => handleQuestionClick(question)}
                      >
                        {question}
                      </ChipButton>
                    ))}
                  </FeatureCard>
                </div>

                {/* File Upload Section */}
                <div className="max-w-2xl mx-auto">
                  <FileUpload
                    onFileUpload={handleFileUpload}
                    onFileDelete={handleFileDelete}
                    uploadedFiles={uploadedFiles}
                    isUploading={isLoading}
                  />
                </div>
              </div>
            )}

            {activeSection === "assistant" && (isChatStarted || !showWelcome) && (
              <ChatInterface 
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            )}

            {activeSection !== "assistant" && (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-text-primary mb-4">
                    {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Section
                  </h2>
                  <p className="text-text-secondary">
                    This section is under development. Use the Assistant to interact with KnowMe.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input (only for assistant when welcome is shown) */}
          {activeSection === "assistant" && !isChatStarted && showWelcome && (
            <ChatInterface 
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
