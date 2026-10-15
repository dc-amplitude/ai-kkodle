/**
 * Verified reference URLs per answer word (1–2 each).
 * @type {Record<string, string[]>}
 */
export const PUZZLE_SOURCES = {
  프롬프트: [
    'https://en.wiktionary.org/wiki/prompt',
    'https://en.wikipedia.org/wiki/Prompt_engineering',
  ],
  토큰: [
    'https://en.wiktionary.org/wiki/token',
    'https://en.wikipedia.org/wiki/Lexical_analysis#Token',
  ],
  임베딩: [
    'https://en.wikipedia.org/wiki/Word_embedding',
    'https://en.wiktionary.org/wiki/embed',
  ],
  파인튜닝: [
    'https://en.wikipedia.org/wiki/Fine-tuning_(deep_learning)',
    'https://en.wiktionary.org/wiki/fine-tune',
  ],
  추론: [
    'https://ko.wikipedia.org/wiki/추론',
    'https://en.wikipedia.org/wiki/Inference',
  ],
  에이전트: [
    'https://en.wikipedia.org/wiki/Intelligent_agent',
    'https://en.wiktionary.org/wiki/agent',
  ],
  가드레일: [
    'https://en.wikipedia.org/wiki/AI_safety',
    'https://en.wiktionary.org/wiki/guardrail',
  ],
  벤치마크: [
    'https://en.wikipedia.org/wiki/Benchmark_(computing)',
    'https://en.wiktionary.org/wiki/benchmark',
  ],
  할루시네이션: [
    'https://en.wikipedia.org/wiki/Hallucination_(artificial_intelligence)',
    'https://en.wiktionary.org/wiki/hallucination',
  ],
  환각: [
    'https://ko.wikipedia.org/wiki/환각',
    'https://en.wikipedia.org/wiki/Hallucination_(artificial_intelligence)',
  ],
  컨텍스트: [
    'https://en.wikipedia.org/wiki/Context_(computing)',
    'https://en.wiktionary.org/wiki/context',
  ],
  모델: [
    'https://en.wikipedia.org/wiki/Mathematical_model',
    'https://ko.wikipedia.org/wiki/모델',
  ],
  파라미터: [
    'https://en.wikipedia.org/wiki/Parameter',
    'https://en.wiktionary.org/wiki/parameter',
  ],
  배치: [
    'https://en.wikipedia.org/wiki/Batch_processing',
    'https://en.wiktionary.org/wiki/batch',
  ],
  에폭: [
    'https://en.wikipedia.org/wiki/Epoch_(machine_learning)',
    'https://en.wiktionary.org/wiki/epoch',
  ],
  오버피팅: [
    'https://en.wikipedia.org/wiki/Overfitting',
    'https://en.wiktionary.org/wiki/overfit',
  ],
  언더피팅: [
    'https://en.wikipedia.org/wiki/Underfitting',
  ],
  드리프트: [
    'https://en.wikipedia.org/wiki/Concept_drift',
    'https://en.wiktionary.org/wiki/drift',
  ],
  라벨링: [
    'https://en.wikipedia.org/wiki/Data_labeling',
    'https://en.wiktionary.org/wiki/label',
  ],
  검증: [
    'https://ko.wikipedia.org/wiki/검증',
    'https://en.wikipedia.org/wiki/Validation',
  ],
  평가: [
    'https://ko.wikipedia.org/wiki/평가',
    'https://en.wikipedia.org/wiki/Evaluation',
  ],
  체인: [
    'https://en.wikipedia.org/wiki/Chain-of-thought_prompting',
    'https://en.wiktionary.org/wiki/chain',
  ],
  오케스트레이션: [
    'https://en.wikipedia.org/wiki/Orchestration_(computing)',
    'https://en.wiktionary.org/wiki/orchestration',
  ],
  리트리벌: [
    'https://en.wikipedia.org/wiki/Information_retrieval',
    'https://en.wiktionary.org/wiki/retrieve',
  ],
  리랭킹: [
    'https://en.wikipedia.org/wiki/Learning_to_rank',
    'https://en.wiktionary.org/wiki/rank',
  ],
  청크: [
    'https://en.wikipedia.org/wiki/Chunk_(information)',
    'https://en.wiktionary.org/wiki/chunk',
  ],
  유사도: [
    'https://en.wikipedia.org/wiki/Similarity_(geometry)',
    'https://ko.wikipedia.org/wiki/유사',
  ],
  프롬프트엔지니어링: [
    'https://en.wikipedia.org/wiki/Prompt_engineering',
  ],
  레드팀: [
    'https://en.wikipedia.org/wiki/Red_team',
  ],
  머신러닝: [
    'https://en.wikipedia.org/wiki/Machine_learning',
    'https://ko.wikipedia.org/wiki/머신_러닝',
  ],
  딥러닝: [
    'https://en.wikipedia.org/wiki/Deep_learning',
    'https://ko.wikipedia.org/wiki/딥_러닝',
  ],
  신경망: [
    'https://en.wikipedia.org/wiki/Neural_network',
    'https://ko.wikipedia.org/wiki/인공신경망',
  ],
  트랜스포머: [
    'https://en.wikipedia.org/wiki/Transformer_(deep_learning_architecture)',
  ],
  어텐션: [
    'https://en.wikipedia.org/wiki/Attention_(machine_learning)',
    'https://en.wiktionary.org/wiki/attention',
  ],
  생성형: [
    'https://en.wikipedia.org/wiki/Generative_artificial_intelligence',
    'https://ko.wikipedia.org/wiki/생성형_인공지능',
  ],
  멀티모달: [
    'https://en.wikipedia.org/wiki/Multimodal_learning',
  ],
  사전학습: [
    'https://en.wikipedia.org/wiki/Pre-training',
  ],
  증류: [
    'https://en.wikipedia.org/wiki/Knowledge_distillation',
    'https://en.wiktionary.org/wiki/distillation',
  ],
  양자화: [
    'https://en.wikipedia.org/wiki/Quantization_(signal_processing)',
  ],
  로라: [
    'https://en.wikipedia.org/wiki/Low-rank_adaptation',
  ],
  데이터셋: [
    'https://en.wikipedia.org/wiki/Data_set',
    'https://en.wiktionary.org/wiki/dataset',
  ],
  역전파: [
    'https://en.wikipedia.org/wiki/Backpropagation',
    'https://ko.wikipedia.org/wiki/역전파',
  ],
  샘플링: [
    'https://en.wikipedia.org/wiki/Sampling_(statistics)',
    'https://en.wiktionary.org/wiki/sample',
  ],
  온도: [
    'https://en.wikipedia.org/wiki/Softmax#Temperature',
    'https://en.wiktionary.org/wiki/temperature',
  ],
  검색증강: [
    'https://en.wikipedia.org/wiki/Retrieval-augmented_generation',
  ],
  개인화: [
    'https://en.wikipedia.org/wiki/Personalization',
    'https://ko.wikipedia.org/wiki/개인화',
  ],
  추천: [
    'https://en.wikipedia.org/wiki/Recommender_system',
    'https://ko.wikipedia.org/wiki/추천_시스템',
  ],
  파운데이션: [
    'https://en.wikipedia.org/wiki/Foundation_model',
  ],
  알고리즘: [
    'https://en.wikipedia.org/wiki/Algorithm',
    'https://ko.wikipedia.org/wiki/알고리즘',
  ],
  서버: [
    'https://en.wikipedia.org/wiki/Server_(computing)',
    'https://ko.wikipedia.org/wiki/서버',
  ],
  클라우드: [
    'https://en.wikipedia.org/wiki/Cloud_computing',
    'https://ko.wikipedia.org/wiki/클라우드_컴퓨팅',
  ],
  데이터베이스: [
    'https://en.wikipedia.org/wiki/Database',
    'https://ko.wikipedia.org/wiki/데이터베이스',
  ],
  스키마: [
    'https://en.wikipedia.org/wiki/Database_schema',
    'https://en.wiktionary.org/wiki/schema',
  ],
  쿼리: [
    'https://en.wikipedia.org/wiki/Query_language',
    'https://en.wiktionary.org/wiki/query',
  ],
  인덱스: [
    'https://en.wikipedia.org/wiki/Database_index',
    'https://en.wiktionary.org/wiki/index',
  ],
  엔드포인트: [
    'https://en.wikipedia.org/wiki/Endpoint_(API)',
  ],
  웹훅: [
    'https://en.wikipedia.org/wiki/Webhook',
  ],
  벡터: [
    'https://en.wikipedia.org/wiki/Vector_(mathematics_and_physics)',
    'https://ko.wikipedia.org/wiki/벡터',
  ],
  캐시: [
    'https://en.wikipedia.org/wiki/Cache_(computing)',
    'https://ko.wikipedia.org/wiki/캐시',
  ],
  프록시: [
    'https://en.wikipedia.org/wiki/Proxy_server',
    'https://ko.wikipedia.org/wiki/프록시_서버',
  ],
  레이턴시: [
    'https://en.wikipedia.org/wiki/Latency_(engineering)',
    'https://en.wiktionary.org/wiki/latency',
  ],
  스루풋: [
    'https://en.wikipedia.org/wiki/Throughput',
    'https://en.wiktionary.org/wiki/throughput',
  ],
  배포: [
    'https://en.wikipedia.org/wiki/Software_deployment',
    'https://ko.wikipedia.org/wiki/배포',
  ],
  컨테이너: [
    'https://en.wikipedia.org/wiki/Containerization_(computing)',
  ],
  스택: [
    'https://en.wikipedia.org/wiki/Solution_stack',
    'https://en.wiktionary.org/wiki/stack',
  ],
  레거시: [
    'https://en.wikipedia.org/wiki/Legacy_system',
    'https://en.wiktionary.org/wiki/legacy',
  ],
  리팩터링: [
    'https://en.wikipedia.org/wiki/Code_refactoring',
    'https://en.wiktionary.org/wiki/refactor',
  ],
  테스트: [
    'https://en.wikipedia.org/wiki/Software_testing',
    'https://ko.wikipedia.org/wiki/소프트웨어_테스트',
  ],
  회귀: [
    'https://en.wikipedia.org/wiki/Regression_testing',
    'https://ko.wikipedia.org/wiki/회귀_분석',
  ],
  핫픽스: [
    'https://en.wikipedia.org/wiki/Patch_(computing)',
    'https://en.wiktionary.org/wiki/hotfix',
  ],
  인시던트: [
    'https://en.wikipedia.org/wiki/Incident_management',
    'https://en.wiktionary.org/wiki/incident',
  ],
  모니터링: [
    'https://en.wikipedia.org/wiki/Application_performance_management',
    'https://ko.wikipedia.org/wiki/모니터링',
  ],
  트레이스: [
    'https://en.wikipedia.org/wiki/Tracing_(software)',
    'https://opentelemetry.io/docs/concepts/signals/traces/',
  ],
  스팬: [
    'https://opentelemetry.io/docs/concepts/signals/traces/#spans',
    'https://en.wiktionary.org/wiki/span',
  ],
  샌드박스: [
    'https://en.wikipedia.org/wiki/Sandbox_(computer_security)',
  ],
  스케일링: [
    'https://en.wikipedia.org/wiki/Scalability',
    'https://en.wiktionary.org/wiki/scale',
  ],
  대기열: [
    'https://en.wikipedia.org/wiki/Message_queue',
    'https://ko.wikipedia.org/wiki/대기열',
  ],
  폴백: [
    'https://en.wiktionary.org/wiki/fallback',
    'https://en.wikipedia.org/wiki/Fallback',
  ],
  마이그레이션: [
    'https://en.wikipedia.org/wiki/Data_migration',
    'https://ko.wikipedia.org/wiki/마이그레이션',
  ],
  기능플래그: [
    'https://en.wikipedia.org/wiki/Feature_toggle',
  ],
  프라이버시: [
    'https://en.wikipedia.org/wiki/Privacy',
    'https://ko.wikipedia.org/wiki/프라이버시',
  ],
  암호화: [
    'https://en.wikipedia.org/wiki/Encryption',
    'https://ko.wikipedia.org/wiki/암호',
  ],
  인증: [
    'https://en.wikipedia.org/wiki/Authentication',
    'https://ko.wikipedia.org/wiki/인증',
  ],
  네트워크: [
    'https://en.wikipedia.org/wiki/Computer_network',
    'https://ko.wikipedia.org/wiki/컴퓨터_네트워크',
  ],
  프로토콜: [
    'https://en.wikipedia.org/wiki/Communication_protocol',
    'https://ko.wikipedia.org/wiki/통신_프로토콜',
  ],
  오픈소스: [
    'https://en.wikipedia.org/wiki/Open-source_software',
    'https://ko.wikipedia.org/wiki/오픈_소스',
  ],
  리포지토리: [
    'https://en.wikipedia.org/wiki/Repository_(version_control)',
    'https://en.wiktionary.org/wiki/repository',
  ],
  병렬: [
    'https://en.wikipedia.org/wiki/Parallel_computing',
    'https://ko.wikipedia.org/wiki/병렬_컴퓨팅',
  ],
  분산: [
    'https://en.wikipedia.org/wiki/Distributed_computing',
    'https://ko.wikipedia.org/wiki/분산_컴퓨팅',
  ],
  정규화: [
    'https://en.wikipedia.org/wiki/Normalization_(database)',
    'https://ko.wikipedia.org/wiki/정규화',
  ],
  이상치: [
    'https://en.wikipedia.org/wiki/Outlier',
    'https://ko.wikipedia.org/wiki/이상치',
  ],
  검색: [
    'https://en.wikipedia.org/wiki/Information_retrieval',
    'https://ko.wikipedia.org/wiki/검색',
  ],
  마스킹: [
    'https://en.wikipedia.org/wiki/Data_masking',
  ],
  아티팩트: [
    'https://en.wikipedia.org/wiki/Artifact_(software_development)',
    'https://en.wiktionary.org/wiki/artifact',
  ],
  포스트모템: [
    'https://en.wikipedia.org/wiki/Postmortem_documentation',
    'https://sre.google/sre-book/postmortem-culture/',
  ],
  지피유: [
    'https://en.wikipedia.org/wiki/Graphics_processing_unit',
    'https://ko.wikipedia.org/wiki/그래픽_처리_장치',
  ],
  에이피아이: [
    'https://en.wikipedia.org/wiki/API',
    'https://ko.wikipedia.org/wiki/API',
  ],
  옵저버: [
    'https://en.wikipedia.org/wiki/Observer_pattern',
    'https://en.wiktionary.org/wiki/observer',
  ],
  플래그: [
    'https://en.wikipedia.org/wiki/Feature_toggle',
    'https://en.wiktionary.org/wiki/flag',
  ],
  롤아웃: [
    'https://en.wikipedia.org/wiki/Deployment_management#Rollout',
    'https://en.wiktionary.org/wiki/rollout',
  ],
  코호트: [
    'https://en.wikipedia.org/wiki/Cohort_(statistics)',
    'https://en.wiktionary.org/wiki/cohort',
  ],
  LLM: [
    'https://en.wikipedia.org/wiki/Large_language_model',
    'https://platform.openai.com/docs/guides/gpt',
  ],
  GPU: [
    'https://en.wikipedia.org/wiki/Graphics_processing_unit',
    'https://developer.nvidia.com/cuda-zone',
  ],
  GPT: [
    'https://en.wikipedia.org/wiki/Generative_pre-trained_transformer',
    'https://openai.com/research',
  ],
  RAG: [
    'https://en.wikipedia.org/wiki/Retrieval-augmented_generation',
    'https://arxiv.org/abs/2005.11401',
  ],
  CUDA: [
    'https://en.wikipedia.org/wiki/CUDA',
    'https://developer.nvidia.com/cuda-zone',
  ],
  OpenAI: [
    'https://en.wikipedia.org/wiki/OpenAI',
    'https://openai.com/about',
  ],
  Claude: [
    'https://www.anthropic.com/claude',
    'https://en.wikipedia.org/wiki/Claude_(language_model)',
  ],
  Gemini: [
    'https://en.wikipedia.org/wiki/Gemini_(language_model)',
    'https://deepmind.google/technologies/gemini/',
  ],
  BERT: [
    'https://en.wikipedia.org/wiki/BERT_(language_model)',
    'https://arxiv.org/abs/1810.04805',
  ],
  TPU: [
    'https://en.wikipedia.org/wiki/Tensor_Processing_Unit',
    'https://cloud.google.com/tpu/docs',
  ],
  VRAM: [
    'https://en.wikipedia.org/wiki/Video_RAM',
  ],
  TOKEN: [
    'https://en.wiktionary.org/wiki/token',
    'https://platform.openai.com/tokenizer',
  ],
  META: [
    'https://en.wikipedia.org/wiki/Meta_Platforms',
    'https://about.meta.com/',
  ],
  Llama: [
    'https://en.wikipedia.org/wiki/Llama_(language_model)',
    'https://ai.meta.com/llama/',
  ],
  AWS: [
    'https://en.wikipedia.org/wiki/Amazon_Web_Services',
    'https://aws.amazon.com/what-is-aws/',
  ],
  JSON: [
    'https://www.json.org/json-en.html',
    'https://en.wikipedia.org/wiki/JSON',
  ],
  HTTP: [
    'https://en.wikipedia.org/wiki/HTTP',
    'https://developer.mozilla.org/en-US/docs/Web/HTTP',
  ],
  NVIDIA: [
    'https://en.wikipedia.org/wiki/Nvidia',
    'https://www.nvidia.com/en-us/about-nvidia/',
  ],
};
