// Mock data for Prompt Engineering Toolkit

export const mockPrompts = [
  {
    prompt_id: "001",
    title: "Article Summarizer",
    tags: ["Summarization", "NLP", "Content"],
    isFavorite: true,
    versions: [
      { version_id: "v1", prompt_text: "Summarize the following text in 3 bullet points:\n\n{{input}}", created_at: "2026-04-10T09:00:00Z" },
      { version_id: "v2", prompt_text: "You are an expert summarizer. Condense the following article into 3 clear, concise bullet points. Focus on the key insights.\n\n{{input}}", created_at: "2026-04-11T10:30:00Z" },
      { version_id: "v3", prompt_text: "Role: Expert content analyst\nTask: Summarize the text below into exactly 3 bullet points emphasizing key facts, supporting details, and conclusions.\nFormat: Use '•' for each bullet point.\n\nText:\n{{input}}", created_at: "2026-04-12T14:00:00Z" },
      { version_id: "v4", prompt_text: "Role: Expert content analyst with 10 years of experience in distilling complex information.\nTask: Analyze and summarize the following text into exactly 3 bullet points. Each bullet should cover: (1) Main claim, (2) Key evidence, (3) Actionable conclusion.\nFormat: Start each bullet with '•' and keep each under 25 words.\nConstraints: No jargon. Plain language only.\n\nText:\n{{input}}", created_at: "2026-04-13T16:45:00Z" },
    ],
  },
  {
    prompt_id: "002",
    title: "Code Reviewer",
    tags: ["Code", "Review", "Development"],
    isFavorite: false,
    versions: [
      { version_id: "v1", prompt_text: "Review this code for bugs:\n\n{{input}}", created_at: "2026-04-09T08:00:00Z" },
      { version_id: "v2", prompt_text: "You are a senior software engineer. Review the following code for bugs, performance issues, and best practices. Provide structured feedback.\n\n{{input}}", created_at: "2026-04-11T11:00:00Z" },
    ],
  },
  {
    prompt_id: "003",
    title: "Email Composer",
    tags: ["Writing", "Business", "Email"],
    isFavorite: true,
    versions: [
      { version_id: "v1", prompt_text: "Write a professional email about:\n\n{{input}}", created_at: "2026-04-08T10:00:00Z" },
      { version_id: "v2", prompt_text: "Compose a professional business email. Subject: {{subject}}\nContext: {{input}}\nTone: Formal but warm. End with a clear call to action.", created_at: "2026-04-12T09:00:00Z" },
      { version_id: "v3", prompt_text: "Role: Senior business communications specialist\nTask: Compose a professional email\nFormat: Subject line, greeting, 2-3 body paragraphs, closing, signature placeholder\nContext: {{input}}\nTone: Professional, concise, action-oriented", created_at: "2026-04-13T15:00:00Z" },
    ],
  },
  {
    prompt_id: "004",
    title: "Meeting Notes Generator",
    tags: ["Productivity", "Meetings", "Summary"],
    isFavorite: false,
    versions: [
      { version_id: "v1", prompt_text: "Generate meeting notes from this transcript:\n\n{{input}}", created_at: "2026-04-11T14:00:00Z" },
    ],
  },
];

export const mockTestSuites = [
  {
    suite_id: "001",
    prompt_id: "001",
    name: "Summarizer Test Suite",
    test_cases: [
      {
        id: "tc1",
        input: "The global electric vehicle market grew 35% in 2025, driven by falling battery costs and expanding charging infrastructure. China leads with 60% market share, while Europe saw its fastest growth at 42% YoY.",
        expected_output: "• EV market grew 35% in 2025 driven by lower battery costs and charging expansion\n• China dominates with 60% market share\n• Europe saw fastest regional growth at 42% year-over-year",
      },
      {
        id: "tc2",
        input: "Researchers at MIT have developed a new AI model that can predict protein structures with 98% accuracy, potentially revolutionizing drug discovery and reducing development timelines from years to months.",
        expected_output: "• MIT's AI model achieves 98% accuracy in protein structure prediction\n• Technology could transform drug discovery processes\n• Development timelines may shrink from years to months",
      },
    ],
  },
  {
    suite_id: "002",
    prompt_id: "002",
    name: "Code Review Tests",
    test_cases: [
      {
        id: "tc1",
        input: "function getUserData(id) {\n  const user = db.query('SELECT * FROM users WHERE id = ' + id);\n  return user;\n}",
        expected_output: "Critical: SQL injection vulnerability. Use parameterized queries.",
      },
    ],
  },
];

export const mockResults = [
  {
    result_id: "r001",
    prompt_id: "001",
    version_id: "v4",
    suite_id: "001",
    timestamp: "2026-04-13T17:00:00Z",
    outputs: [
      {
        test_case_id: "tc1",
        input: "The global electric vehicle market grew 35% in 2025...",
        output: "• EV market surged 35% in 2025, fueled by battery cost reductions and charging network expansion\n• China dominates globally holding 60% market share in EV sales\n• European adoption accelerated at 42% YoY, marking fastest regional growth rate",
        exec_time_ms: 1240,
        token_count: 67,
        score: 5,
        keyword_match: 92,
        length_valid: true,
      },
      {
        test_case_id: "tc2",
        input: "Researchers at MIT have developed...",
        output: "• MIT researchers achieved breakthrough 98% accuracy AI model for protein structure prediction\n• Innovation has potential to fundamentally disrupt pharmaceutical drug discovery workflows\n• Drug development timelines could compress dramatically from years down to months",
        exec_time_ms: 980,
        token_count: 54,
        score: 4,
        keyword_match: 87,
        length_valid: true,
      },
    ],
  },
  {
    result_id: "r002",
    prompt_id: "001",
    version_id: "v3",
    suite_id: "001",
    timestamp: "2026-04-12T15:00:00Z",
    outputs: [
      {
        test_case_id: "tc1",
        input: "The global electric vehicle market grew 35% in 2025...",
        output: "• Electric vehicle market expanded 35% in 2025 due to falling battery prices\n• China holds majority share in global EV sales\n• Europe experienced significant growth in EV adoption",
        exec_time_ms: 1100,
        token_count: 48,
        score: 3,
        keyword_match: 74,
        length_valid: true,
      },
    ],
  },
];

export const mockTemplates = [
  {
    template_id: "T001",
    title: "RTF Summarizer",
    category: "Summarization",
    description: "Role-Task-Format prompt for summarizing any content",
    prompt_text: "Role: Expert content analyst\nTask: Summarize the following text into 3 concise bullet points\nFormat: Use '•' with each bullet under 25 words\n\nText:\n{{input}}",
    usage_count: 47,
  },
  {
    template_id: "T002",
    title: "Chain-of-Thought Reasoner",
    category: "Reasoning",
    description: "COT prompt for step-by-step problem solving",
    prompt_text: "Let's think through this step by step.\n\nProblem: {{input}}\n\nStep 1: Identify what is being asked\nStep 2: Break down the key components\nStep 3: Analyze each component\nStep 4: Synthesize the findings\nStep 5: Provide a clear conclusion",
    usage_count: 31,
  },
  {
    template_id: "T003",
    title: "Code Review Expert",
    category: "Development",
    description: "Detailed code review with security and performance focus",
    prompt_text: "You are a senior software engineer with 15 years of experience.\n\nReview the following code for:\n1. Security vulnerabilities\n2. Performance bottlenecks\n3. Best practice violations\n4. Maintainability issues\n\nCode:\n{{input}}\n\nProvide structured feedback with severity levels (Critical/Major/Minor).",
    usage_count: 28,
  },
  {
    template_id: "T004",
    title: "CRISPE Prompt Builder",
    category: "Prompt Engineering",
    description: "Capacity, Role, Insight, Statement, Personality, Experiment format",
    prompt_text: "Capacity: You are an expert in {{domain}}\nRole: Acting as {{role}}\nInsight: The context is {{context}}\nStatement: {{task}}\nPersonality: Maintain a {{tone}} tone\nExperiment: Provide {{format}} output",
    usage_count: 19,
  },
  {
    template_id: "T005",
    title: "Email Composer Pro",
    category: "Business Writing",
    description: "Professional email generator with customizable tone",
    prompt_text: "Compose a professional email:\nContext: {{input}}\nTone: Formal, warm, action-oriented\nStructure: Subject → Greeting → 2-3 body paragraphs → CTA → Sign-off",
    usage_count: 55,
  },
  {
    template_id: "T006",
    title: "Product Description Writer",
    category: "Marketing",
    description: "Persuasive product descriptions that convert",
    prompt_text: "Write a compelling product description for: {{input}}\n\nInclude:\n- Hook (1 sentence)\n- Key benefits (3 bullet points)\n- Technical specs (if applicable)\n- CTA\n\nTone: Enthusiastic, benefit-focused, customer-centric",
    usage_count: 22,
  },
];

export const frameworks = {
  RTF: {
    name: "RTF",
    fullName: "Role–Task–Format",
    color: "blue",
    description: "Define Role, Task, and output Format for structured results",
    fields: [
      { key: "role", label: "Role", placeholder: "e.g., You are an expert content analyst..." },
      { key: "task", label: "Task", placeholder: "e.g., Summarize the following text..." },
      { key: "format", label: "Format", placeholder: "e.g., Use bullet points, keep under 25 words each..." },
    ],
    template: (vals) => `Role: ${vals.role || '[Define the AI role]'}\nTask: ${vals.task || '[Describe the task]'}\nFormat: ${vals.format || '[Specify output format]'}\n\nInput:\n{{input}}`,
  },
  COT: {
    name: "COT",
    fullName: "Chain of Thought",
    color: "purple",
    description: "Guide the model through step-by-step reasoning",
    fields: [
      { key: "problem", label: "Problem Statement", placeholder: "e.g., Analyze the following argument..." },
      { key: "steps", label: "Reasoning Steps", placeholder: "e.g., Step 1: Identify claims, Step 2: Evaluate evidence..." },
      { key: "conclusion", label: "Conclusion Format", placeholder: "e.g., Provide a final verdict with justification..." },
    ],
    template: (vals) => `Let's think through this step by step.\n\nProblem: ${vals.problem || '{{input}}'}\n\n${vals.steps || 'Step 1: Identify the key components\nStep 2: Analyze each component\nStep 3: Synthesize findings'}\n\n${vals.conclusion || 'Provide a clear, reasoned conclusion.'}`,
  },
  CRISPE: {
    name: "CRISPE",
    fullName: "Capacity, Role, Insight, Statement, Personality, Experiment",
    color: "green",
    description: "Comprehensive 6-part framework for maximum precision",
    fields: [
      { key: "capacity", label: "Capacity", placeholder: "e.g., Expert AI researcher..." },
      { key: "role", label: "Role", placeholder: "e.g., Acting as a technical writer..." },
      { key: "insight", label: "Insight (Context)", placeholder: "e.g., The audience is non-technical..." },
      { key: "statement", label: "Statement (Task)", placeholder: "e.g., Explain how neural networks work..." },
      { key: "personality", label: "Personality (Tone)", placeholder: "e.g., Clear, engaging, use analogies..." },
    ],
    template: (vals) => `Capacity: ${vals.capacity || '[Expert domain]'}\nRole: ${vals.role || '[Acting as]'}\nInsight: ${vals.insight || '[Context/background]'}\nStatement: ${vals.statement || '[The task]'}\nPersonality: ${vals.personality || '[Tone and style]'}\nExperiment: Provide the best possible response for: {{input}}`,
  },
};
