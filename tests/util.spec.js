/* eslint-disable no-undef, react/no-multi-comp,
react/no-unused-state, react/prop-types, no-return-assign */
import React from 'react';
import Tree, { TreeNode } from '../src';
import {
  convertDataToTree,
  conductCheck,
  conductExpandParent,
  getDragNodesKeys,
  getDataAndAria,
  parseCheckedKeys,
} from '../src/util';
import {
  flattenTreeData,
  convertTreeToData,
  convertDataToEntities,
  getTreeNodeProps,
} from '../src/utils/treeUtil';
import { spyConsole, spyError } from './util';

describe('Util', () => {
  spyConsole();

  it('convertTreeToData - case1', () => {
    const tree = (
      <Tree>
        <TreeNode key="bamboo" title="Bamboo" />
        <TreeNode key="is" title="Is">
          <TreeNode key="the" title="The" />
          <TreeNode key="best" title="Best" />
          <TreeNode key="plant" title="Plant">
            <TreeNode key="in" title="In" />
            <TreeNode key="our" title="Our" />
            <TreeNode key="world" title="World" />
          </TreeNode>
        </TreeNode>
        <TreeNode key="!" really />
      </Tree>
    );

    const treeData = convertTreeToData(tree.props.children);
    expect(treeData).toEqual([
      { key: 'bamboo', title: 'Bamboo' },
      {
        key: 'is',
        title: 'Is',
        children: [
          { key: 'the', title: 'The' },
          { key: 'best', title: 'Best' },
          {
            key: 'plant',
            title: 'Plant',
            children: [
              { key: 'in', title: 'In' },
              { key: 'our', title: 'Our' },
              { key: 'world', title: 'World' },
            ],
          },
        ],
      },
      { key: '!', title: '---', really: true },
    ]);
  });

  it('convertTreeToData - case2', () => {
    const treeData = [
      { key: 'rc', title: 'RC' },
      {
        key: 'tree',
        title: 'Tree',
        children: [
          {
            key: 'can',
            title: 'Can',
            children: [
              { key: 'do', title: 'Do' },
              { key: 'the', title: 'The' },
              { key: 'filter', title: 'Filter', yes: 'no' },
            ],
          },
        ],
      },
    ];

    const $treeNode = convertDataToTree(treeData);

    expect(convertTreeToData($treeNode)).toEqual(treeData);
  });

  it('convertDataToTree', () => {
    const treeData = [
      {
        title: '0-0',
        key: '0-0',
        children: [
          {
            title: '0-0-0',
            key: '0-0-0',
          },
        ],
      },
    ];

    const treeNodes = convertDataToTree(treeData, {
      processProps: props => ({
        ...props,
        value: props.title,
      }),
    });

    expect(treeNodes[0].props.value).toBe('0-0');
    expect(treeNodes[0].props.children[0].props.value).toBe('0-0-0');
  });

  it('convertTreeToEntities with additional handler', () => {
    const onProcessFinished = jest.fn();

    const tree = (
      <Tree>
        <TreeNode key="key" title="test" value="ttt" />
      </Tree>
    );

    const { keyEntities, valueEntities } = convertDataToEntities(
      convertTreeToData(tree.props.children),
      {
        initWrapper: wrapper => ({
          ...wrapper,
          valueEntities: {},
        }),
        processEntity: (entity, wrapper) => {
          wrapper.valueEntities[entity.node.value] = entity;
        },
        onProcessFinished,
      },
    );

    expect(onProcessFinished).toHaveBeenCalled();
    expect(valueEntities.ttt).toBe(keyEntities.key);
  });

  // You can remove this test if refactor remove conductCheck function
  describe('conductCheck', () => {
    describe('basic', () => {
      const genTree = props => (
        <Tree {...props}>
          <TreeNode key="greed" title="GreeIs" />
          <TreeNode key="good" title="good">
            <TreeNode key="there" title="There" />
            <TreeNode key="is" title="Is">
              <TreeNode key="no" title="No" />
              <TreeNode key="spoon" title="Spoon">
                <TreeNode key="i" title="I" />
                <TreeNode key="see" title="See" />
                <TreeNode key="dead" title="Dead">
                  <TreeNode key="people" title="People" />
                  <TreeNode key="!" title="!" />
                </TreeNode>
              </TreeNode>
            </TreeNode>
          </TreeNode>
        </Tree>
      );

      it('check', () => {
        const tree = genTree();
        const { keyEntities } = convertDataToEntities(convertTreeToData(tree.props.children));
        const { checkedKeys, halfCheckedKeys } = conductCheck(['spoon'], true, keyEntities);
        expect(checkedKeys.sort()).toEqual(['spoon', 'i', 'see', 'dead', 'people', '!'].sort());
        expect(halfCheckedKeys.sort()).toEqual(['good', 'is'].sort());
      });

      it('uncheck', () => {
        const tree = genTree({ checkedKeys: ['greed', 'good'] });
        const { keyEntities } = convertDataToEntities(convertTreeToData(tree.props.children));

        // First, we check all
        const allCheckedKeys = conductCheck(['greed', 'good'], true, keyEntities).checkedKeys;
        expect(allCheckedKeys.length).toEqual(11);

        // Then uncheck one of then
        const { checkedKeys, halfCheckedKeys } = conductCheck(['spoon'], false, keyEntities, {
          checkedKeys: allCheckedKeys,
        });
        expect(checkedKeys.sort()).toEqual(['greed', 'there', 'no'].sort());
        expect(halfCheckedKeys.sort()).toEqual(['good', 'is'].sort());
      });

      describe('not exist', () => {
        const errorSpy = spyError();

        it('works', () => {
          const tree = genTree();
          const { keyEntities } = convertDataToEntities(convertTreeToData(tree.props.children));
          const { checkedKeys, halfCheckedKeys } = conductCheck(['notExist'], true, keyEntities);
          expect(errorSpy()).toHaveBeenCalledWith("Warning: Tree missing follow keys: 'notExist'");
          expect(checkedKeys).toEqual([]);
          expect(halfCheckedKeys).toEqual([]);
        });
      });
    });

    describe('part disabled', () => {
      const genTree = props => (
        <Tree {...props}>
          <TreeNode key="war">
            <TreeNode key="are" />
            <TreeNode key="not">
              <TreeNode key="it" />
              <TreeNode key="used" disabled>
                <TreeNode key="to" />
                <TreeNode key="be" />
              </TreeNode>
            </TreeNode>
          </TreeNode>
        </Tree>
      );

      it('check', () => {
        const tree = genTree();
        const { keyEntities } = convertDataToEntities(convertTreeToData(tree.props.children));

        const result1 = conductCheck(['not'], true, keyEntities);
        expect(result1.checkedKeys.sort()).toEqual(['not', 'it'].sort());
        expect(result1.halfCheckedKeys.sort()).toEqual(['war'].sort());

        const result2 = conductCheck(['to', 'be'], true, keyEntities);
        expect(result2.checkedKeys.sort()).toEqual(['to', 'be'].sort());
        expect(result2.halfCheckedKeys.sort()).toEqual([].sort());
      });

      it('uncheck', () => {
        const tree = genTree();
        const { keyEntities } = convertDataToEntities(convertTreeToData(tree.props.children));

        // First, we check all
        const allCheckedKeys = conductCheck(['war', 'to', 'be'], true, keyEntities).checkedKeys;
        expect(allCheckedKeys.length).toEqual(6);

        // Then uncheck one of then
        const result1 = conductCheck(['not'], false, keyEntities, { checkedKeys: allCheckedKeys });
        expect(result1.checkedKeys.sort()).toEqual(['are', 'to', 'be'].sort());
        expect(result1.halfCheckedKeys.sort()).toEqual(['war'].sort());

        const result2 = conductCheck(['to', 'be'], false, keyEntities, {
          checkedKeys: allCheckedKeys,
        });
        expect(result2.checkedKeys.sort()).toEqual(['war', 'are', 'not', 'it'].sort());
        expect(result2.halfCheckedKeys.sort()).toEqual([].sort());
      });
    });
  });

  it('conductExpandParent', () => {
    const tree = (
      <Tree>
        <TreeNode key="bamboo">
          <TreeNode key="is">
            <TreeNode key="good" />
          </TreeNode>
        </TreeNode>
      </Tree>
    );

    const { keyEntities } = convertDataToEntities(convertTreeToData(tree.props.children));
    const keys = conductExpandParent(['good'], keyEntities);
    expect(keys.sort()).toEqual(['bamboo', 'is', 'good'].sort());
  });

  it('getDragNodesKeys', () => {
    const tree = (
      <Tree defaultExpandAll>
        <TreeNode key="000">
          <TreeNode key="111">
            <TreeNode key="222" />
            <TreeNode key="333" />
          </TreeNode>
        </TreeNode>
      </Tree>
    );

    const { keyEntities } = convertDataToEntities(convertTreeToData(tree.props.children));
    const keys0 = getDragNodesKeys('000', keyEntities);
    expect(keys0.sort()).toEqual(['000', '111', '222', '333'].sort());

    const keys1 = getDragNodesKeys('111', keyEntities);
    expect(keys1.sort()).toEqual(['111', '222', '333'].sort());
  });

  describe('getDataAndAria', () => {
    it('should return only data- and aria- properties', () => {
      const props = {
        'data-test': 'name',
        'aria-label': 'name',
        dataSource: '/api',
        ariaLabel: 'some-label',
      };
      expect(getDataAndAria(props)).toEqual({
        'data-test': 'name',
        'aria-label': 'name',
      });
    });
  });

  it('parseCheckedKeys warning', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(parseCheckedKeys(233)).toBe(null);

    expect(errorSpy).toHaveBeenCalledWith('Warning: `checkedKeys` is not an array or an object');

    errorSpy.mockRestore();
  });

  it('flatten treeNode', () => {
    function getNode(key, children) {
      return {
        key,
        title: key,
        children,
      };
    }

    const flattenList = flattenTreeData(
      [
        getNode('0', [
          getNode('0-0'),
          getNode('0-1'),
          getNode('0-2', [getNode('0-2-0'), getNode('0-2-1')]),
        ]),
        getNode('1'),
      ],
      ['0-2', '0'],
    );

    expect(flattenList.map(({ key }) => key)).toEqual([
      '0',
      '0-0',
      '0-1',
      '0-2',
      '0-2-0',
      '0-2-1',
      '1',
    ]);
  });

  it('not crash if node not exist with getTreeNodeProps', () => {
    const nodeProps = getTreeNodeProps('not-exist', {
      expandedKeys: [],
      selectedKeys: [],
      loadedKeys: [],
      loadingKeys: [],
      checkedKeys: [],
      halfCheckedKeys: [],
      dragOverNodeKey: null,
      dropPosition: null,
      keyEntities: {},
    });

    expect(nodeProps).toEqual(
      expect.objectContaining({
        checked: false,
        eventKey: 'not-exist',
        expanded: false,
        halfChecked: false,
        loaded: false,
        loading: false,
        pos: '',
        selected: false,
      }),
    );
  });
});
