/**
 * @typedef {Object} TableProjectCardHelpers
 * @property {() => boolean} isPlayable whether table is able to placed a project card
 * @property {(card: Card) => void} play play a project card on table
 * @property {(card: Card) => void} remove remove a project card on table
 * @property {() => void} reset remove all project cards and reset max slots
 * @property {(n: number) => void} activateNSlots activate N project card slots on table
 * @property {(projectCard: Card, slotIdx: number, playerId: string, initialPoints: number,
 *  isOwner?: boolean) => void} placeSlotById place an arbitrary resource card on the project slot by slot index
 *  with initial contribution points
 */
/**
 * The method collection to play card, remove card, update score, ... etc. from/on the table.
 * Each property represent a disjoint functionality includes data store and main board rendering update
 * @typedef {object} Table
 * @property {TableProjectCardHelpers} ProjectCard project card methods includes play, isPlayable, place
 */
/** @type {Table} */
const Table = (() => {
  /** @type {TableProjectCardHelpers} */
  const ProjectCard = (() => {
    const tableProjectCard = SpreadsheetApp.getActive().getSheetByName('TableProjectCard');
    // table helpers
    const getMax = () => tableProjectCard.getRange('B1').getValue();
    const setMax = (max) => {
      tableProjectCard.getRange('B1').setValue(max);
    };
    const getCount = () => tableProjectCard.getRange('B2').getValue();
    const setCount = (count) => tableProjectCard.getRange('B2').setValue(count);
    const findEmptyId = () => {
      const cards = tableProjectCard.getRange(11, 1, getMax(), 1).getValues().map(row => row[0]);
      const idx = cards.findIndex(c => !c);
      if (idx < 0) {
        Logger.log('Cannot find project card slot on table');
        throw new Error('Cannot find project card slot on table');
      }
      return idx;
    };
    const findCardId = (card) => {
      const cards = tableProjectCard.getRange(11, 1, getMax(), 1).getValues().map(row => row[0]);
      const idx = cards.findIndex(c => c === card);
      if (idx < 0) {
        Logger.log(`Cannot find project card ${card} on table`);
        throw new Error(`Cannot find project card ${card} on table`);
      }
      return idx;
    };
    /** @type {(spec: ProjectCardSpecObject, id: number) => void} */
    const addCardSpecById = (spec, id) => {
      Logger.log(`add card spec by id ${id}`);
      // set basis info
      const basicInfoRow = [spec.name, spec.type];
      tableProjectCard.getRange(11 + id, 1, 1, 2).setValues([basicInfoRow]);

      // set slots info
      const slotInfoRows = spec.groups.map((group, idx) => {
        const row = [group.title, /* palyerId */, /* points */, idx];
        return [...new Array(group.slots)].map(_ => row);
      }).reduce((rows, slotRows) => [...rows, ...slotRows], []);
      tableProjectCard.getRange(21 + 10 * id, 1, 6, 4).setValues(slotInfoRows);

      // set groups info
      const groupInfoRows = spec.groups.map((group) => {
        const row = [group.title, /* current */, group.goalContributionPoints];
        return row;
      });
      tableProjectCard.getRange(21 + 10 * id, 5, spec.groups.length, 3).setValues(groupInfoRows);
      // increament the project card count
      setCount(getCount() + 1);
    };
    const removeCardById = (id) => {
      // clear name, type, owner, and exts. 4 is the ext buffers
      tableProjectCard.getRange(11 + id, 1, 1, 3 + 4).clearContent();
      // clear slots info
      tableProjectCard.getRange(21 + 10 * id, 1, 6, 4).clearContent();
      // clear groups info
      tableProjectCard.getRange(21 + 10 * id, 5, 6, 3).clearContent();
      // decreament the project card count
      setCount(getCount() - 1);
    };
    const removeAllCards = () => {
      // clear name, type, owner, and exts. 4 is the ext buffers
      tableProjectCard.getRange(11, 1, getMax(), 3 + 4).clearContent();
      [...new Array(getMax() - 0)].map((_, i) => i + 0).forEach((id) => {
        // clear slots info
        tableProjectCard.getRange(21 + 10 * id, 1, 6, 4).clearContent();
        // clear groups info
        tableProjectCard.getRange(21 + 10 * id, 5, 6, 3).clearContent();
      });
      setCount(0);
    };
    const getProjectTypeById = (id) => tableProjectCard.getRange(11 + id, 2).getValue();
    const setProjectTypeById = (type, id) => tableProjectCard.getRange(11 + id, 2).setValue(type);
    const getProjectOnwerById = (id) => tableProjectCard.getRange(11 + id, 3).getValue();
    const setProjectOnwerById = (ownerId, id) => tableProjectCard.getRange(11 + id, 3).setValue(ownerId);
    const setPlayerOnSlotById = (playerId, id, slotId) => {
      if (tableProjectCard.getRange(21 + 10 * id + slotId, 2).getValue()) {
        Logger.log(`Slot ${slotId} on card ${id} is occupied`);
        throw new Error(`Slot ${slotId} on card ${id} is occupied`);
      }
      tableProjectCard.getRange(21 + 10 * id + slotId, 2).setValue(playerId);
    };
    const getContributionPointOnSlotById = (id, slotId) => tableProjectCard.getRange(21 + 10 * id + slotId, 3).getValue();
    const setContributionPointOnSlotById = (points, id, slotId) => tableProjectCard.getRange(21 + 10 * id + slotId, 3).setValue(points);

    // table render helpers
    const getDefaultCardRange = () => tableProjectCard.getRange('D1:H9');
    const getDeactiveCardRange = () => tableProjectCard.getRange('J1:N9');
    // find card template range from default deck
    const findCardTemplateRange = (card) => {
      const idx = defaultDeck.getRange('A2:A31').getDisplayValues().map(row => row[0]).findIndex(c => c === card);
      if (idx < 0) {
        Logger.log('failed to find project card range' + card);
        throw new Error('failed to find render project card range');
      }
      const row = idx % 10;
      const column = Math.floor(idx / 10);
      return projectCardsBoard.getRange(9 * row + 1, 5 * column + 1, 9, 5);
    };
    // find card range on table
    const findTableRangeById = (id) => {
      const row = id % 2;
      const col = Math.floor(id / 2);
      return mainBoard.getRange(2 + 9 * row, 7 + 5 * col, 9, 5);
    };
    const setPlayerOnTableSlotById = (playerId, id, slotId, isOwner = false) => {
      const range = findTableRangeById(id);
      range.offset(3 + slotId, 1, 1, 1).setValue(playerId);
      range.offset(3 + slotId, 0, 1, 1).setValue(isOwner);
    };
    const setContributionPointOnTableSlotById = (points, id, slotId) => {
      const range = findTableRangeById(id);
      range.offset(3 + slotId, 4, 1, 1).setValue(points);
    };

    const isPlayable = () => getMax() > getCount();
    const play = (card) => {
      const cardSpec = ProjectCardRef.getSpecByCard(card);
      const emptyIdx = findEmptyId();
      // set card data on hidden board
      addCardSpecById(cardSpec, emptyIdx);

      // render card on table
      const cardRange = findCardTemplateRange(card);
      // find table range to paste the card
      const tableRange = findTableRangeById(emptyIdx);
      cardRange.copyTo(tableRange);
    };
    const remove = (card) => {
      const cardIdx = findCardId(card);
      // remove card data on hidden board
      removeCardById(cardIdx);

      // render card on table
      const defaultCardRange = getDefaultCardRange();
      // find table range to paste the default card
      const tableRange = findTableRangeById(cardIdx);

      defaultCardRange.copyTo(tableRange);
    };
    const reset = () => {
      // reset rendering
      [0, 1, 2, 3, 4, 5].map(findTableRangeById).forEach(range => {
        getDefaultCardRange().copyTo(range);
      });
      [6, 7].map(findTableRangeById).forEach(range => {
        getDeactiveCardRange().copyTo(range);
      });
      // reset cards
      removeAllCards();
      // reset max
      setMax(6);
    };
    const activateNSlots = (n) => {
      const currentMax = getMax();
      if (n > currentMax) {
        // activate slots
        [...new Array(n - currentMax)].map((_, i) => i + currentMax)
          .map(findTableRangeById).forEach(range => {
            getDefaultCardRange().copyTo(range);
          });
      }
      if (n < currentMax) {
        // deactivate slots
        [...new Array(currentMax - n)].map((_, i) => i + n)
          .map(findTableRangeById).forEach(range => {
            getDeactiveCardRange().copyTo(range);
          });
      }
      // update maximum
      setMax(n);
    };
    const placeSlotById = (project, slotId, playerId, initialPoints, isOwner = false) => {
      const cardId = findCardId(project);
      // set player on slot
      setPlayerOnSlotById(playerId, cardId, slotId);
      // set initial contribution point
      setContributionPointOnSlotById(initialPoints, cardId, slotId);
      // TODO: add contribution point to group
      if (isOwner) {
        setProjectOnwerById(playerId, cardId);
      }
      Logger.log(`player ${playerId} occupy slot ${slotId} on project ${project} on data table`);

      // render on table
      // set player on slot
      setPlayerOnTableSlotById(playerId, cardId, slotId, isOwner);
      // set initial contribution point
      setContributionPointOnTableSlotById(initialPoints, cardId, slotId);
      Logger.log(`render the player ${playerId} takes slot ${slotId} on project ${project} on table`);
    };

    return {
      isPlayable,
      play,
      remove,
      reset,
      activateNSlots,
      placeSlotById,
    };
  })();

  return {
    ProjectCard,
  };
})();