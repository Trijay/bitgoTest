const axios = require("axios");

async function getTxs(startIndex) {
    try {
        const blockIdObj = await axios.get(
            "https://blockstream.info/api/block-height/680000"
        );
        const blockId = blockIdObj.data;
        // console.log('Start Index', startIndex);
        const blockTransactionsObj = await axios.get(
            `https://blockstream.info/api/block/${blockId}/txs/${startIndex}`
        );
        // console.log('blockTransactionObj', blockTransactionsObj);
        return blockTransactionsObj.data;
    } catch {
        console.log("error in transaction list!");
    }
}

function findAllAncestrySets(graph, inDegree, sources, sortedOrder, allSortedOrders) {
    if (sources.length > 0) {
        for (let i = 0; i < sources.length; i++) {
            const ancestor = sources[i];
            // console.log('Ancestors', ancestor);
            sortedOrder.push(ancestor);
            const sourcesForNextCall = sources.slice(0);
            sourcesForNextCall.splice(sourcesForNextCall.indexOf(ancestor), 1);
            graph[ancestor].forEach((descendant) => {
                inDegree[descendant]--;
                if (inDegree[descendant] === 0) {
                    sourcesForNextCall.push(descendant);
                }
            });

            findAllAncestrySets(
                graph,
                inDegree,
                sourcesForNextCall,
                sortedOrder,
                allSortedOrders
            );

            sortedOrder.splice(sortedOrder.indexOf(ancestor), 1);
            for (i = 0; i < graph[ancestor].length; i++) {
                inDegree[graph[ancestor][i]] += 1;
            }
        }
    }

    if (
        graph[sortedOrder[sortedOrder.length - 1]] &&
        graph[sortedOrder[sortedOrder.length - 1]].length === 0
    ) {
        const completePath = sortedOrder.slice(0);
        allSortedOrders.push(completePath);
    }
}

async function countAncestors() {

    let allTxs = [];
    for (let startIndex = 0; startIndex < 225; startIndex) {
        const next25Txs = await getTxs(startIndex);
        startIndex += 25;
        allTxs = [...allTxs, ...next25Txs];
    }

    const txsArray = new Array(allTxs.length);
    for (let i = 0; i < allTxs.length; i++) {
        const ancestor = allTxs[i].vin[0].txid.toString();
        const descendant = allTxs[i].txid.toString();
        txsArray[i] = [ancestor, descendant];
    }

    // console.log('Checking Ancestors and Descendant', txsArray);

    const graph = {};
    const inDegree = {};
    txsArray.forEach((edge) => {
        const ancestor = edge[0];
        const descendant = edge[1];
        if (!graph[descendant]) graph[descendant] = [];
        if (!graph[ancestor]) graph[ancestor] = [descendant];
        else graph[ancestor].push(descendant);
        if (!inDegree[descendant]) inDegree[descendant] = 1;
        else inDegree[descendant]++;
    });

    const sources = [];
    for (let i = 0; i < txsArray.length; i++) {
        if (!inDegree[txsArray[i][0]]) sources.push(txsArray[i][0]);
    }

    const sortedOrder = [];
    const allSortedOrders = [];

    for (let i = 0; i < sources.length; i++) {
        findAllAncestrySets(graph, inDegree, [sources[i]], sortedOrder, allSortedOrders);
    }

    allSortedOrders.sort((a, b) => b.length - a.length);

    const output = {};
    for (let i = 0; i < 10; i++) {
        const numberOfAncestors = allSortedOrders[i].length - 1;
        output[allSortedOrders[i][numberOfAncestors]] = numberOfAncestors;
    }

    console.log(output);
}

countAncestors();