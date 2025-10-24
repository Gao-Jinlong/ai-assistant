import { Injectable } from '@nestjs/common';
import { ModelManagerService } from '@server/model-manager/model-manager.service';
import {
  BaseMessage,
  AIMessage,
  BaseMessageLike,
} from '@langchain/core/messages';
import { MODEL_TYPE } from '@server/model-manager/interface';
import { MessageService } from '@server/message/message.service';
import { Tool } from '@langchain/core/tools';
import { Thread } from '@prisma/client';
import {
  END,
  Annotation,
  MessagesAnnotation,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
// import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { TavilySearch } from '@langchain/tavily';

@Injectable()
export class AgentService {
  constructor(
    private modelManagerService: ModelManagerService,
    private messageService: MessageService,
  ) {}

  async run(data: {
    thread: Thread;
    memory: BaseMessage[];
    message: BaseMessageLike;
  }) {
    const { thread, memory, message } = data;

    const graph = await this.createGraph();
    const agent = graph.compile();

    const stream = await agent.stream(
      {
        messages: [...memory, message],
      },
      {
        streamMode: ['messages', 'custom'],
      },
    );

    return stream;
  }

  async createGraph() {
    const state = Annotation.Root({
      messages: Annotation<BaseMessageLike[]>({
        reducer: (x, y) => x.concat(y),
      }),
    });
    const model = this.modelManagerService.getModel(MODEL_TYPE.LLM);
    const tools: Tool[] = [
      new TavilySearch({ maxResults: 3 }) as unknown as Tool,
    ];
    const toolNode = new ToolNode(tools);

    model.bindTools?.(tools);

    function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
      const lastMessage = messages[messages.length - 1] as AIMessage;

      if (lastMessage.tool_calls?.length) {
        return 'tools';
      }
      return END;
    }

    async function callModel(state: typeof MessagesAnnotation.State) {
      const response = await model.invoke(state.messages);

      return { messages: [response] };
    }

    const graph = new StateGraph(MessagesAnnotation)
      .addNode('agent', callModel)
      .addEdge(START, 'agent')
      .addNode('tools', toolNode)
      .addEdge('tools', 'agent')
      .addConditionalEdges('agent', shouldContinue);

    return graph;
  }
}
