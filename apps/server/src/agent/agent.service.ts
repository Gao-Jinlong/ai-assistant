import { Injectable } from '@nestjs/common';
import { ModelManagerService } from '@server/model-manager/model-manager.service';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { MODEL_TYPE } from '@server/model-manager/interface';
import { ChatRequestDto } from './dto/chat-request.dto';
import { MessageService } from '@server/message/message.service';
import { Tool } from '@langchain/core/tools';
import { PromptTemplate } from '@langchain/core/prompts';
import { Thread } from '@prisma/client';
import { Runnable } from '@langchain/core/runnables';
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { ToolNode } from '@langchain/langgraph/prebuilt';

@Injectable()
export class AgentService {
  constructor(
    private modelManagerService: ModelManagerService,
    private messageService: MessageService,
  ) {}

  async run(data: { thread: Thread; memory: BaseMessage[]; message: string }) {
    const { thread, memory, message } = data;

    const graph = await this.createGraph();
    const app = graph.compile();

    const stream = await app.stream({
      messages: [new HumanMessage(message)],
    });

    return stream;
  }

  async createGraph() {
    const modelInstance = await this.modelManagerService.getModelByType(
      MODEL_TYPE.LLM,
    );
    const tools = [new TavilySearchResults({ maxResults: 3 })];
    const toolNode = new ToolNode(tools);

    const model = modelInstance.model.bindTools(tools);

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
      .addNode('tools', toolNode)
      .addEdge(START, 'agent')
      .addEdge('tools', 'agent')
      .addConditionalEdges('agent', shouldContinue);

    return graph;
  }
}
