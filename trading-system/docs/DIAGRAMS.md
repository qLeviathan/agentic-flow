# System Diagrams - Trading System Architecture

## Mermaid Diagram Definitions
These diagrams can be rendered in any Mermaid-compatible viewer (GitHub, VS Code, etc.)

---

## 1. High-Level System Context

```mermaid
graph TB
    User[User/CLI] --> TradingSystem[Trading System MVP]
    TradingSystem --> TiingoAPI[Tiingo API<br/>Market Data]
    TradingSystem --> FREDAPI[FRED API<br/>Economic Data]
    TradingSystem --> AgentDB[(AgentDB<br/>Local Storage)]

    style TradingSystem fill:#4a90e2,color:#fff
    style TiingoAPI fill:#50c878,color:#fff
    style FREDAPI fill:#50c878,color:#fff
    style AgentDB fill:#f4a460,color:#fff
```

---

## 2. Component Architecture

```mermaid
graph TD
    subgraph "Data Layer"
        Tiingo[TiingoClient]
        FRED[FREDClient]
        Cache[CacheManager]
    end

    subgraph "Mathematical Framework"
        Fib[FibonacciEngine]
        Lucas[LucasEngine]
        Zeck[ZeckendorfCodec]
        Log[LogSpaceOps]
    end

    subgraph "AgentDB Integration"
        Reflex[ReflexionStore]
        Skills[SkillLibrary]
        Causal[CausalMemory]
        Vector[VectorSearch]
    end

    subgraph "Strategy Engine"
        Base[BaseStrategy]
        FibStrat[FibRetrace]
        LucasStrat[LucasCycle]
        Signal[SignalGenerator]
        Risk[RiskManager]
    end

    subgraph "Backtesting"
        Engine[BacktestEngine]
        Metrics[PerformanceMetrics]
        Validator[StatValidator]
    end

    subgraph "Visualization"
        Charts[ChartGenerator]
        Dash[Dashboard]
    end

    Tiingo --> Fib
    FRED --> Lucas
    Cache --> Zeck
    Fib --> FibStrat
    Lucas --> LucasStrat
    Reflex --> Base
    Skills --> Signal
    Causal --> Signal
    Signal --> Engine
    Risk --> Engine
    Engine --> Metrics
    Metrics --> Validator
    Validator --> Charts
    Charts --> Dash

    style Fib fill:#4a90e2,color:#fff
    style Lucas fill:#4a90e2,color:#fff
    style Zeck fill:#4a90e2,color:#fff
    style Engine fill:#e74c3c,color:#fff
```

---

## 3. Data Flow Sequence

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant DataLayer
    participant MathFramework
    participant AgentDB
    participant Strategy
    participant Backtest
    participant Viz

    User->>CLI: Execute backtest command
    CLI->>DataLayer: Fetch market data
    DataLayer->>DataLayer: Check cache
    alt Cache miss
        DataLayer->>External: API request
        External-->>DataLayer: JSON response
    end
    DataLayer->>MathFramework: Raw data
    MathFramework->>MathFramework: Encode prices (int)
    MathFramework->>MathFramework: Compress (Zeckendorf)
    MathFramework->>AgentDB: Store compressed data
    MathFramework->>Strategy: Normalized data
    Strategy->>AgentDB: Query past patterns
    AgentDB-->>Strategy: Similar setups
    Strategy->>Strategy: Generate signals
    Strategy->>Backtest: Execute trades
    Backtest->>Backtest: Calculate metrics
    Backtest->>AgentDB: Store outcomes
    Backtest->>Viz: Results
    Viz->>User: Charts + Report
```

---

## 4. Strategy Signal Generation Flow

```mermaid
flowchart TD
    Start([Market Data]) --> Regime{Detect<br/>Regime}
    Regime -->|Low Vol Bull| Skills1[Get Best Skills<br/>for Regime]
    Regime -->|High Vol Bear| Skills2[Get Best Skills<br/>for Regime]
    Regime -->|Sideways| Skills3[Get Best Skills<br/>for Regime]

    Skills1 --> Strategies[Load Strategies<br/>FibRetrace, LucasCycle, etc.]
    Skills2 --> Strategies
    Skills3 --> Strategies

    Strategies --> Parallel{Run Parallel}

    Parallel --> Fib[FibRetrace<br/>Signal]
    Parallel --> Luc[LucasCycle<br/>Signal]
    Parallel --> Mean[MeanReversion<br/>Signal]
    Parallel --> Trend[TrendFollowing<br/>Signal]

    Fib --> Weights[Apply Regime Weights]
    Luc --> Weights
    Mean --> Weights
    Trend --> Weights

    Weights --> Aggregate[Weighted Average<br/>Signal]
    Aggregate --> Threshold{Threshold<br/>>0.3?}

    Threshold -->|Yes| Position[Calculate<br/>Position Size]
    Threshold -->|No| NoTrade([No Trade])

    Position --> Risk{Risk<br/>Check}
    Risk -->|Pass| Execute([Execute Trade])
    Risk -->|Fail| NoTrade

    style Start fill:#50c878,color:#fff
    style Execute fill:#e74c3c,color:#fff
    style NoTrade fill:#95a5a6,color:#fff
```

---

## 5. Mathematical Framework Pipeline

```mermaid
flowchart LR
    Price[Price: $178.45] --> Encode[Encode<br/>FibonacciEngine]
    Encode --> Int[Integer: 178450000<br/>cents × 10^6]

    Int --> Calc[Calculate<br/>Fib Levels]
    Calc --> Levels[Levels Array<br/>int64]

    Levels --> Delta[Delta Encode<br/>ZeckendorfCodec]
    Delta --> Zeck[Zeckendorf<br/>Binary String]

    Zeck --> Compress[Compress<br/>to Bytes]
    Compress --> Storage[(AgentDB<br/>Storage)]

    Storage --> Decompress[Decompress<br/>from Bytes]
    Decompress --> Restore[Restore<br/>Integer Array]

    Restore --> Decode[Decode<br/>FibonacciEngine]
    Decode --> Final[Price: $178.45]

    style Price fill:#50c878,color:#fff
    style Int fill:#4a90e2,color:#fff
    style Storage fill:#f4a460,color:#fff
    style Final fill:#50c878,color:#fff
```

---

## 6. AgentDB Learning Loop

```mermaid
graph TB
    Trade[Execute Trade] --> Outcome{Trade<br/>Outcome}

    Outcome -->|Profit| Success[Store Success<br/>Pattern]
    Outcome -->|Loss| Failure[Analyze<br/>Mistake]

    Success --> Embed1[Generate<br/>Context Embedding]
    Failure --> Embed2[Generate<br/>Context Embedding]

    Embed1 --> Store1[(ReflexionStore<br/>Add Pattern)]
    Embed2 --> Store2[(ReflexionStore<br/>Add Anti-Pattern)]

    Store1 --> Update1[Update<br/>Strategy Weights]
    Store2 --> Update2[Update<br/>Strategy Weights]

    Update1 --> Skills[(SkillLibrary<br/>Update)]
    Update2 --> Skills

    Skills --> Memory[(CausalMemory<br/>Update Regime)]

    Memory --> NextTrade[Next Trade<br/>Decision]
    NextTrade --> Similar[Vector Search<br/>Similar Setups]

    Similar --> Learn{Learned<br/>from Past?}
    Learn -->|Yes| Better[Better Decision]
    Learn -->|No| Trade

    Better --> Trade

    style Trade fill:#4a90e2,color:#fff
    style Skills fill:#50c878,color:#fff
    style Memory fill:#50c878,color:#fff
    style Better fill:#e74c3c,color:#fff
```

---

## 7. Caching Strategy

```mermaid
flowchart TD
    Request[Data Request] --> CheckCache{Check<br/>Cache}

    CheckCache -->|Recent 90d| Hot[(SQLite<br/>Hot Cache)]
    CheckCache -->|Older| Cold[(AgentDB<br/>Cold Storage)]
    CheckCache -->|Miss| API[External API]

    Hot -->|Hit| Uncomp[Uncompressed<br/>Data]
    Cold -->|Hit| Comp[Compressed<br/>Data]
    API --> Fetch[Fetch Data]

    Uncomp --> Return[Return Data]
    Comp --> Decompress[Zeckendorf<br/>Decompress]
    Decompress --> Return

    Fetch --> Store{Age}
    Store -->|Recent| StoreHot[Store in<br/>SQLite]
    Store -->|Historical| StoreCold[Store in<br/>AgentDB Compressed]

    StoreHot --> Return
    StoreCold --> Return

    Return --> Client([Client])

    style Hot fill:#50c878,color:#fff
    style Cold fill:#4a90e2,color:#fff
    style API fill:#e74c3c,color:#fff
```

---

## 8. Backtest Execution Timeline

```mermaid
gantt
    title Backtest Execution Timeline
    dateFormat YYYY-MM-DD
    section Data Acquisition
    Fetch Tiingo Data       :a1, 2024-01-01, 2d
    Fetch FRED Data         :a2, 2024-01-01, 2d
    section Data Processing
    Encode Prices           :b1, after a1, 1d
    Compress Series         :b2, after b1, 1d
    section Strategy Setup
    Load Historical Patterns:c1, after b2, 1d
    Initialize Strategies   :c2, after c1, 1d
    section Backtest Loop
    Event-Driven Simulation :d1, after c2, 5d
    section Analysis
    Calculate Metrics       :e1, after d1, 1d
    Statistical Validation  :e2, after e1, 1d
    section Output
    Generate Charts         :f1, after e2, 1d
    Create Dashboard        :f2, after f1, 1d
```

---

## 9. Module Dependency Graph

```mermaid
graph BT
    subgraph "Level 0: Foundation"
        Stdlib[Standard Library]
        Numpy[NumPy]
        Pandas[Pandas]
        AgentDBLib[AgentDB Library]
    end

    subgraph "Level 1: Math"
        Fib[FibonacciEngine]
        Lucas[LucasEngine]
        Zeck[ZeckendorfCodec]
    end

    subgraph "Level 2: Data"
        Tiingo[TiingoClient]
        FRED[FREDClient]
        Cache[CacheManager]
    end

    subgraph "Level 3: Memory"
        Reflex[ReflexionStore]
        Skills[SkillLibrary]
        Causal[CausalMemory]
    end

    subgraph "Level 4: Strategy"
        Base[BaseStrategy]
        FibStrat[FibRetrace]
        Signal[SignalGenerator]
        Risk[RiskManager]
    end

    subgraph "Level 5: Backtest"
        Engine[BacktestEngine]
        Metrics[PerformanceMetrics]
    end

    subgraph "Level 6: Viz"
        Charts[ChartGenerator]
        Dash[Dashboard]
    end

    subgraph "Level 7: CLI"
        Main[main]
        ArgParser[ArgParser]
    end

    Fib --> Numpy
    Lucas --> Numpy
    Zeck --> Fib
    Tiingo --> Zeck
    FRED --> Lucas
    Cache --> Zeck
    Reflex --> AgentDBLib
    Skills --> Reflex
    Causal --> Skills
    Base --> Reflex
    FibStrat --> Fib
    Signal --> Skills
    Risk --> Signal
    Engine --> Risk
    Metrics --> Engine
    Charts --> Metrics
    Dash --> Charts
    Main --> Dash

    style Main fill:#e74c3c,color:#fff
    style Engine fill:#4a90e2,color:#fff
    style Fib fill:#50c878,color:#fff
```

---

## 10. Performance Optimization Layers

```mermaid
flowchart TD
    Code[Python Code] --> Layer1{Integer<br/>Operations?}

    Layer1 -->|Yes| Fast1[5x Speedup<br/>vs Float]
    Layer1 -->|No| Layer2{Vectorized?}

    Layer2 -->|Yes| Fast2[50x Speedup<br/>vs Loops]
    Layer2 -->|No| Layer3{Cached?}

    Layer3 -->|Yes| Fast3[100x Speedup<br/>vs API Call]
    Layer3 -->|No| Layer4{Compressed?}

    Layer4 -->|Yes| Fast4[3.5x Storage<br/>Reduction]
    Layer4 -->|No| Slow[Slow Path]

    Fast1 --> Optimized[Optimized<br/>Execution]
    Fast2 --> Optimized
    Fast3 --> Optimized
    Fast4 --> Optimized

    Optimized --> Target{Meets<br/>Target?}
    Target -->|>10K bars/s| Success([Success])
    Target -->|No| Profile[Profile Code]

    Profile --> Bottleneck{Find<br/>Bottleneck}
    Bottleneck --> Code

    Slow --> Profile

    style Optimized fill:#50c878,color:#fff
    style Success fill:#4a90e2,color:#fff
    style Slow fill:#e74c3c,color:#fff
```

---

## 11. Trade Execution State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> Analyzing: New bar arrives
    Analyzing --> Calculating: Regime detected
    Calculating --> Signaling: Indicators calculated

    Signaling --> NoSignal: Signal weak
    Signaling --> HasSignal: Signal strong

    NoSignal --> Idle

    HasSignal --> RiskCheck: Calculate position
    RiskCheck --> Rejected: Fails risk limits
    RiskCheck --> Approved: Passes risk check

    Rejected --> Idle

    Approved --> Executing: Submit order
    Executing --> Filled: Order filled
    Executing --> Failed: Order failed

    Failed --> Idle

    Filled --> InPosition: Position opened
    InPosition --> Monitoring: Track P&L

    Monitoring --> StopHit: Stop loss triggered
    Monitoring --> TargetHit: Take profit hit
    Monitoring --> NewBar: Continue monitoring

    NewBar --> Monitoring

    StopHit --> Closing: Exit position
    TargetHit --> Closing

    Closing --> Closed: Position closed
    Closed --> Recording: Log to AgentDB
    Recording --> Learning: Update reflexion
    Learning --> Idle

    Idle --> [*]
```

---

## 12. Data Compression Comparison

```mermaid
graph LR
    subgraph "Uncompressed"
        U1[10 Years Daily]
        U2[500 Symbols]
        U3[Float64]
        U4[10.08 MB]
    end

    subgraph "Integer Encoding"
        I1[10 Years Daily]
        I2[500 Symbols]
        I3[Int32]
        I4[5.04 MB<br/>50% Reduction]
    end

    subgraph "Zeckendorf"
        Z1[10 Years Daily]
        Z2[500 Symbols]
        Z3[Compressed]
        Z4[2.88 MB<br/>71% Reduction]
    end

    U4 --> I4
    I4 --> Z4

    style U4 fill:#e74c3c,color:#fff
    style I4 fill:#f39c12,color:#fff
    style Z4 fill:#50c878,color:#fff
```

---

## Usage Instructions

To render these diagrams:

1. **GitHub**: Paste into any `.md` file in a GitHub repo
2. **VS Code**: Install "Markdown Preview Mermaid Support" extension
3. **Online**: Use https://mermaid.live/
4. **Documentation sites**: Most support Mermaid natively (GitBook, Docusaurus, etc.)

Example for embedding in documentation:
```markdown
# System Architecture

## Component Diagram
```mermaid
graph TD
    A[Component A] --> B[Component B]
```
```

The diagrams will render as interactive SVG graphics.
