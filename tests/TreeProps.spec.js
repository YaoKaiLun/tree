/* eslint-disable no-undef, react/no-multi-comp */
import React from 'react';
import { render, mount } from 'enzyme';
import { renderToJson } from 'enzyme-to-json';
import PropTypes from 'prop-types';
import Tree, { TreeNode } from '../src';
import { InternalTreeNode } from '../src/TreeNode';
import { objectMatcher, spyConsole, spyError } from './util';

/**
 * For refactor purpose. All the props should be passed by test
 */

// Promisify timeout to let jest catch works
function timeoutPromise(delay = 0) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}

describe('Tree Props', () => {
  spyConsole();

  // prefixCls
  it('prefixCls', () => {
    const withoutPrefix = render(<Tree />);
    expect(renderToJson(withoutPrefix)).toMatchSnapshot();

    const withPrefix = render(<Tree prefixCls="test-prefix" />);
    expect(renderToJson(withPrefix)).toMatchSnapshot();
  });

  // showLine
  it('showLine', () => {
    const wrapper = render(<Tree showLine />);
    expect(renderToJson(wrapper)).toMatchSnapshot();
  });

  // showIcon
  it('showIcon', () => {
    const withIcon = render(
      <Tree>
        <TreeNode>
          <TreeNode>
            <TreeNode />
          </TreeNode>
          <TreeNode />
        </TreeNode>
        <TreeNode />
      </Tree>,
    );
    expect(renderToJson(withIcon)).toMatchSnapshot();

    const withoutIcon = render(
      <Tree showIcon={false}>
        <TreeNode>
          <TreeNode>
            <TreeNode />
          </TreeNode>
          <TreeNode />
        </TreeNode>
        <TreeNode />
      </Tree>,
    );
    expect(renderToJson(withoutIcon)).toMatchSnapshot();

    const withOpenIcon = render(
      <Tree defaultExpandedKeys={['0-0']}>
        <TreeNode>
          <TreeNode key="0-0">
            <TreeNode />
          </TreeNode>
          <TreeNode />
        </TreeNode>
        <TreeNode />
      </Tree>,
    );
    expect(renderToJson(withOpenIcon)).toMatchSnapshot();
  });

  describe('selectable', () => {
    // selectable - false
    it('without selectable', () => {
      const handleOnSelect = jest.fn();
      const handleOnCheck = jest.fn();

      const withoutSelectableBase = (
        <Tree onSelect={handleOnSelect} defaultExpandedKeys={['0-0']} selectable={false}>
          <TreeNode key="0-0">
            <TreeNode key="0-0-0" />
          </TreeNode>
        </Tree>
      );

      expect(renderToJson(render(withoutSelectableBase))).toMatchSnapshot();

      const withoutSelectable = mount(withoutSelectableBase);
      const parentNode = withoutSelectable.find(InternalTreeNode).first();
      const targetNode = parentNode.find(InternalTreeNode).last();

      targetNode.find('.rc-tree-node-content-wrapper').simulate('click');

      expect(handleOnSelect).not.toHaveBeenCalled();
      expect(handleOnCheck).not.toHaveBeenCalled(); // Will test in checkable
    });

    // selectable - true
    it('with selectable', () => {
      const handleOnSelect = jest.fn();

      const withSelectableBase = (
        <Tree onSelect={handleOnSelect} defaultExpandedKeys={['0-0']}>
          <TreeNode key="0-0">
            <TreeNode key="0-0-0" />
          </TreeNode>
        </Tree>
      );

      expect(renderToJson(render(withSelectableBase))).toMatchSnapshot();

      const withSelectable = mount(withSelectableBase);
      const parentNode = withSelectable.find(InternalTreeNode).first();
      const targetNode = withSelectable.find(InternalTreeNode).last();

      // Select leaf
      targetNode.find('.rc-tree-node-content-wrapper').simulate('click');

      // traverseTreeNodes loops origin TreeNode and
      // onSelect trigger on `cloneElement` which is not the same instance
      expect(handleOnSelect).toHaveBeenCalledWith(
        ['0-0-0'],
        objectMatcher({
          event: 'select',
          selected: true,
          node: targetNode.instance(),
          selectedNodes: [{ key: '0-0-0' }],
          nativeEvent: {},
        }),
      );
      handleOnSelect.mockReset();

      // un-select leaf
      targetNode.find('.rc-tree-node-content-wrapper').simulate('click');
      expect(handleOnSelect).toHaveBeenCalledWith(
        [],
        objectMatcher({
          event: 'select',
          selected: false,
          node: targetNode.instance(),
          selectedNodes: [],
          nativeEvent: {},
        }),
      );
      handleOnSelect.mockReset();

      // Select leaf and then parent
      targetNode.find('.rc-tree-node-content-wrapper').simulate('click');
      expect(handleOnSelect).toHaveBeenCalledWith(
        ['0-0-0'],
        objectMatcher({
          event: 'select',
          selected: true,
          node: targetNode.instance(),
          selectedNodes: [{ key: '0-0-0' }],
          nativeEvent: {},
        }),
      );
      handleOnSelect.mockReset();

      parentNode
        .find('.rc-tree-node-content-wrapper')
        .first()
        .simulate('click');
      expect(handleOnSelect).toHaveBeenCalledWith(
        ['0-0'],
        objectMatcher({
          event: 'select',
          selected: true,
          node: parentNode.instance(),
          selectedNodes: [{ key: '0-0' }],
          nativeEvent: {},
        }),
      );
    });
  });

  // multiple - this prop works with selectable
  it('multiple', () => {
    const handleOnSelect = jest.fn();

    const multipleBase = (
      <Tree onSelect={handleOnSelect} defaultExpandAll multiple>
        <TreeNode key="0-0">
          <TreeNode key="0-0-0" />
        </TreeNode>
      </Tree>
    );

    expect(renderToJson(render(multipleBase))).toMatchSnapshot();

    const wrapper = mount(multipleBase);
    const parentNode = wrapper.find(InternalTreeNode).first();
    const targetNode = wrapper.find(InternalTreeNode).last();

    // Leaf select
    targetNode.find('.rc-tree-node-content-wrapper').simulate('click');
    expect(handleOnSelect).toHaveBeenCalledWith(
      ['0-0-0'],
      objectMatcher({
        event: 'select',
        selected: true,
        node: targetNode.instance(),
        selectedNodes: [{ key: '0-0-0' }],
        nativeEvent: {},
      }),
    );
    handleOnSelect.mockReset();

    // Parent select
    parentNode
      .find('.rc-tree-node-content-wrapper')
      .first()
      .simulate('click');
    expect(handleOnSelect).toHaveBeenCalledWith(
      ['0-0-0', '0-0'],
      objectMatcher({
        event: 'select',
        selected: true,
        node: parentNode.instance(),
        selectedNodes: [{ key: '0-0-0' }, { key: '0-0' }],
        nativeEvent: {},
      }),
    );
    handleOnSelect.mockReset();

    // Leaf un-select
    targetNode.find('.rc-tree-node-content-wrapper').simulate('click');
    expect(handleOnSelect).toHaveBeenCalledWith(
      ['0-0'],
      objectMatcher({
        event: 'select',
        selected: false,
        node: targetNode.instance(),
        selectedNodes: [{ key: '0-0' }],
        nativeEvent: {},
      }),
    );
  });

  // checkable
  describe('checkable', () => {
    it('default', () => {
      const handleOnSelect = jest.fn();
      const handleOnCheck = jest.fn();

      const withCheckableBase = (
        <Tree
          onSelect={handleOnSelect}
          onCheck={handleOnCheck}
          defaultExpandedKeys={['0-0']}
          checkable
        >
          <TreeNode key="0-0">
            <TreeNode key="0-0-0" />
          </TreeNode>
        </Tree>
      );

      expect(renderToJson(render(withCheckableBase))).toMatchSnapshot();

      const withCheckable = mount(withCheckableBase);
      const targetNode = withCheckable.find(InternalTreeNode).last();

      // Click leaf
      targetNode.find('.rc-tree-node-content-wrapper').simulate('click');
      expect(handleOnSelect).toHaveBeenCalledWith(
        ['0-0-0'],
        objectMatcher({
          event: 'select',
          selected: true,
          node: targetNode.instance(),
          selectedNodes: [{ key: '0-0-0' }],
          nativeEvent: {},
        }),
      );
      expect(handleOnCheck).not.toHaveBeenCalled();
      expect(handleOnSelect).toHaveBeenCalled();

      handleOnCheck.mockReset();
      handleOnSelect.mockReset();

      // Click checkbox
      targetNode.find('.rc-tree-checkbox').simulate('click');

      expect(handleOnCheck).toHaveBeenCalledWith(
        ['0-0-0', '0-0'],
        objectMatcher({
          event: 'check',
          checked: true,
          node: targetNode.instance(),
          checkedNodes: [{ key: '0-0-0' }, { key: '0-0' }],
          nativeEvent: {},
        }),
      );
      expect(handleOnSelect).not.toHaveBeenCalled();
    });

    it('without selectable', () => {
      const handleOnSelect = jest.fn();
      const handleOnCheck = jest.fn();

      const withCheckableBase = (
        <Tree
          onSelect={handleOnSelect}
          onCheck={handleOnCheck}
          defaultExpandedKeys={['0-0']}
          selectable={false}
          checkable
        >
          <TreeNode key="0-0">
            <TreeNode key="0-0-0" />
          </TreeNode>
        </Tree>
      );

      expect(renderToJson(render(withCheckableBase))).toMatchSnapshot();

      const withCheckable = mount(withCheckableBase);
      const targetNode = withCheckable.find(InternalTreeNode).last();

      // Click leaf
      targetNode.find('.rc-tree-node-content-wrapper').simulate('click');
      expect(handleOnCheck).toHaveBeenCalledWith(
        ['0-0-0', '0-0'],
        objectMatcher({
          event: 'check',
          checked: true,
          node: targetNode.instance(),
          checkedNodes: [{ key: '0-0-0' }, { key: '0-0' }],
          nativeEvent: {},
        }),
      );
      expect(handleOnSelect).not.toHaveBeenCalled();
    });

    it('node set checkable to `false`', () => {
      const wrapper = mount(
        <Tree checkable defaultExpandAll>
          <TreeNode key="0-0">
            <TreeNode key="0-0-0" checkable={false} />
          </TreeNode>
        </Tree>,
      );

      expect(
        wrapper
          .find('TreeNode')
          .at(0)
          .find('.rc-tree-checkbox').length,
      ).toBeTruthy();
      expect(
        wrapper
          .find('TreeNode')
          .at(1)
          .find('.rc-tree-checkbox').length,
      ).toBeFalsy();
    });
  });

  // Don't crash
  describe('invalidate checkedKeys', () => {
    const errorSpy = spyError();

    const genWrapper = checkedKeys =>
      mount(
        <Tree checkedKeys={checkedKeys} defaultExpandAll checkable>
          <TreeNode key="0-0">
            <TreeNode key="0-0-0" />
          </TreeNode>
        </Tree>,
      );

    it('null', () => {
      const wrapper = genWrapper(null);
      expect(errorSpy()).not.toHaveBeenCalledWith(
        'Warning: `checkedKeys` is not an array or an object',
      );
      expect(wrapper.render()).toMatchSnapshot();
    });

    it('number', () => {
      const wrapper = genWrapper(123);
      expect(errorSpy()).toHaveBeenCalledWith(
        'Warning: `checkedKeys` is not an array or an object',
      );
      expect(wrapper.render()).toMatchSnapshot();
    });
  });

  // checkStrictly
  it('checkStrictly', () => {
    const handleOnCheck = jest.fn();

    const wrapper = mount(
      <Tree onCheck={handleOnCheck} defaultExpandedKeys={['0-0']} checkable checkStrictly>
        <TreeNode key="0-0">
          <TreeNode key="0-0-0" />
        </TreeNode>
      </Tree>,
    );

    expect(wrapper.render()).toMatchSnapshot();

    const targetNode = wrapper.find(InternalTreeNode).last();

    // Click Leaf
    targetNode.find('.rc-tree-checkbox').simulate('click');
    expect(handleOnCheck).toHaveBeenCalledWith(
      {
        checked: ['0-0-0'],
        halfChecked: [],
      },
      objectMatcher({
        event: 'check',
        checked: true,
        node: targetNode.instance(),
        checkedNodes: [{ key: '0-0-0' }],
        nativeEvent: {},
      }),
    );
  });

  // draggable - is already full test in Tree.spec.js
  // autoExpandParent - is already full test in Tree.spec.js

  // defaultExpandAll
  it('defaultExpandAll', () => {
    const wrapper = render(
      <Tree defaultExpandAll>
        <TreeNode key="0-0">
          <TreeNode key="0-0-0" />
        </TreeNode>
      </Tree>,
    );

    expect(renderToJson(wrapper)).toMatchSnapshot();
  });

  // defaultCheckedKeys - is already full test in Tree.spec.js
  // defaultSelectedKeys - is already full test in Tree.spec.js

  describe('loadData', () => {
    it('basic', () => {
      let called = 0;

      const handleLoadData = jest.fn();

      class Demo extends React.Component {
        state = {
          loaded: false,
        };

        loadData = (...args) => {
          called += 1;
          handleLoadData(...args);

          this.setState({ loaded: true });

          return Promise.resolve();
        };

        render() {
          // Hide icon will still show the icon for loading status
          return (
            <Tree loadData={this.loadData} showIcon={false}>
              <TreeNode key="0-0">{this.state.loaded ? <TreeNode key="0-0-0" /> : null}</TreeNode>
            </Tree>
          );
        }
      }

      const wrapper = mount(<Demo />);

      expect(handleLoadData).not.toHaveBeenCalled();

      const switcher = wrapper.find('.rc-tree-switcher');
      const node = wrapper.find(InternalTreeNode).instance();
      switcher.simulate('click');

      return timeoutPromise().then(() => {
        expect(handleLoadData).toHaveBeenCalledWith(node);
        expect(called).toBe(1);
        expect(renderToJson(wrapper.render())).toMatchSnapshot();
      });
    });

    // https://github.com/ant-design/ant-design/issues/11689#issuecomment-411712770
    it('with expandedKeys', () => {
      let called = 0;
      const keys = {};
      const loadData = ({ props: { eventKey } }) => {
        keys[eventKey] = (keys[eventKey] || 0) + 1;

        return new Promise(() => {
          called += 1;
        });
      };

      const tree = mount(
        <Tree loadData={loadData} expandedKeys={['0', '1', '2']}>
          <TreeNode key="0" />
          <TreeNode key="1" />
          <TreeNode key="2" />
        </Tree>,
      );

      tree.setProps({ expandedKeys: ['0', '1', '2'] });

      return timeoutPromise().then(() => {
        expect(called).toBe(3);
        expect(keys[0]).toBe(1);
        expect(keys[1]).toBe(1);
        expect(keys[2]).toBe(1);
      });
    });

    it('with defaultExpandedKeys', () => {
      let called = 0;
      const keys = {};
      const loadData = ({ props: { eventKey } }) => {
        keys[eventKey] = (keys[eventKey] || 0) + 1;

        return new Promise(() => {
          called += 1;
        });
      };

      const wrapper = mount(
        <Tree loadData={loadData} defaultExpandedKeys={['0', '1', '2']}>
          <TreeNode key="0" />
          <TreeNode key="1" />
          <TreeNode key="2" />
        </Tree>,
      );

      // Do not trigger loadData
      wrapper
        .find('.rc-tree-switcher')
        .at(0)
        .simulate('click');
      wrapper
        .find('.rc-tree-switcher')
        .at(0)
        .simulate('click');

      return timeoutPromise().then(() => {
        expect(called).toBe(3);
        expect(keys[0]).toBe(1);
        expect(keys[1]).toBe(1);
        expect(keys[2]).toBe(1);
      });
    });

    // https://github.com/ant-design/ant-design/issues/12217
    it('node has false isLeaf & no loadData function', () => {
      const onExpand = jest.fn();
      const wrapper = mount(
        <Tree onExpand={onExpand}>
          <TreeNode key="0" isLeaf={false} />
        </Tree>,
      );

      const switcher = wrapper.find('.rc-tree-switcher');
      switcher.simulate('click');

      expect(onExpand).toHaveBeenCalled();

      // If has dead loop. This test will not be end.
    });

    // https://github.com/ant-design/ant-design/issues/12464
    it('by controlled', done => {
      const treeData = [
        {
          title: 'demo1',
          key: 'demo1',
          value: 'demo1',
          children: [
            {
              title: 'demo2',
              key: 'demo2',
              value: 'demo3',
            },
          ],
        },
      ];

      let count = 0;

      class Test extends React.Component {
        state = {
          loadedKeys: [],
        };

        onLoad = loadedKeys => {
          this.setState({ loadedKeys });
        };

        loadData = () => {
          count += 1;
          return Promise.resolve();
        };

        render() {
          return (
            <Tree
              loadData={this.loadData}
              loadedKeys={this.state.loadedKeys}
              onLoad={this.onLoad}
              treeData={treeData}
            />
          );
        }
      }

      const wrapper = mount(<Test />);

      // Parent click
      wrapper.find('.rc-tree-switcher').simulate('click');

      setTimeout(() => {
        // Child click
        wrapper
          .find('.rc-tree-switcher')
          .at(1)
          .simulate('click');

        setTimeout(() => {
          expect(count).toBe(2);
          done();
        }, 500);
      }, 500);
    });
  });

  it('icon', () => {
    // Node icon has much higher priority
    const wrapper = render(
      <Tree defaultExpandAll icon={<span>ROOT ICON</span>}>
        <TreeNode key="0-0">
          <TreeNode key="0-0-0" icon={<span>CUSTOMIZE ICON</span>} />
        </TreeNode>
      </Tree>,
    );

    expect(renderToJson(wrapper)).toMatchSnapshot();
  });

  it('onClick', () => {
    const onClick = jest.fn();

    const wrapper = mount(
      <Tree onClick={onClick} defaultExpandedKeys={['0-0']}>
        <TreeNode key="0-0">
          <TreeNode key="0-0-0" />
        </TreeNode>
      </Tree>,
    );

    const parentNode = wrapper.find(InternalTreeNode).first();
    const targetNode = parentNode.find(InternalTreeNode).last();

    // Select leaf
    targetNode.find('.rc-tree-node-content-wrapper').simulate('click');

    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({}), targetNode.instance());
  });

  it('onDoubleClick', () => {
    const onClick = jest.fn();
    const onDoubleClick = jest.fn();

    const wrapper = mount(
      <Tree onClick={onClick} onDoubleClick={onDoubleClick} defaultExpandedKeys={['0-0']}>
        <TreeNode key="0-0">
          <TreeNode key="0-0-0" />
        </TreeNode>
      </Tree>,
    );

    const parentNode = wrapper.find(InternalTreeNode).first();
    const targetNode = parentNode.find(InternalTreeNode).last();

    // Select leaf
    targetNode.find('.rc-tree-node-content-wrapper').simulate('doubleclick');

    expect(onClick).not.toHaveBeenCalled();
    expect(onDoubleClick).toHaveBeenCalledWith(expect.objectContaining({}), targetNode.instance());
  });

  describe('loadedKeys & onLoad', () => {
    it('has loadedKeys', () => {
      const loadData = jest.fn(() => Promise.resolve());
      const onLoad = jest.fn();

      const wrapper = mount(
        <Tree loadedKeys={['0-0']} loadData={loadData} onLoad={onLoad}>
          <TreeNode key="0-0" />
        </Tree>,
      );

      wrapper.find('.rc-tree-switcher').simulate('click');
      expect(loadData).not.toHaveBeenCalled();
      expect(onLoad).not.toHaveBeenCalled();
    });

    it('reset loadedKeys', () => {
      class FakePromise {
        constructor(val) {
          this.val = val;
        }

        then = func => {
          const ret = func(this.val);
          return new FakePromise(ret);
        };
      }

      let wrapper;

      const loadData = jest.fn(() => new FakePromise());
      const onLoad = jest.fn(() => {
        wrapper.setProps({ loadedKeys: ['0-0'] });
      });

      wrapper = mount(
        <Tree loadedKeys={['0-0']} loadData={loadData} onLoad={onLoad}>
          <TreeNode key="0-0" />
        </Tree>,
      );
      wrapper.setProps({ loadedKeys: [] });
      wrapper.find('.rc-tree-switcher').simulate('click');
      expect(loadData).toHaveBeenCalledWith(wrapper.find(InternalTreeNode).instance());
      expect(onLoad).toHaveBeenCalledWith(['0-0'], {
        event: 'load',
        node: wrapper.find(InternalTreeNode).instance(),
      });
    });
  });

  it('treeData', () => {
    const treeData = [
      { key: 'K0', title: 'T0' },
      {
        key: 'K1',
        title: 'T1',
        children: [
          { key: 'K10', title: 'T10' },
          {
            key: 'K11',
            title: 'T11',
            children: [{ key: 'K110', title: 'T110' }, { key: 'K111', title: 'T111' }],
          },
          { key: 'K12', title: 'T12' },
        ],
      },
    ];
    const wrapper = mount(<Tree treeData={treeData} defaultExpandAll />);
    expect(wrapper.render()).toMatchSnapshot();

    const newTreeData = [{ key: 'K0', title: 'T0' }];
    wrapper.setProps({ treeData: newTreeData });
    wrapper.update();
    expect(wrapper.render()).toMatchSnapshot();
  });

  describe('disabled', () => {
    it('basic', () => {
      const wrapper = render(
        <Tree defaultExpandAll disabled>
          <TreeNode key="0-0" />
        </Tree>,
      );
      expect(wrapper).toMatchSnapshot();
    });

    it('treeNode should disabled when tree disabled', () => {
      const wrapper = render(
        <Tree defaultExpandAll disabled>
          <TreeNode key="0-0" disabled={false} />
        </Tree>,
      );
      expect(wrapper).toMatchSnapshot();
    });
  });

  it('motion', () => {
    const motion = {
      motionName: 'bamboo',
    };
    const wrapper = mount(
      <Tree motion={motion}>
        <TreeNode key="0-0">
          <TreeNode key="0-0-0" />
        </TreeNode>
      </Tree>,
    );

    const switcher = wrapper.find('.rc-tree-switcher');
    switcher.simulate('click');

    expect(wrapper.find('CSSMotion').props()).toMatchObject(motion);
  });

  describe('data and aria props', () => {
    it('renders data attributes', () => {
      const wrapper = render(<Tree data-test="tree" />);
      expect(renderToJson(wrapper)).toMatchSnapshot();
    });

    it('renders aria attributes', () => {
      const wrapper = render(<Tree aria-label="name" />);
      expect(renderToJson(wrapper)).toMatchSnapshot();
    });
  });

  describe('custom switcher icon', () => {
    function switcherIcon(text, testLeaf) {
      const sfc = ({ isLeaf }) => {
        if (testLeaf) {
          return isLeaf ? <span>{text}</span> : null;
        }
        return isLeaf ? null : <span>{text}</span>;
      };

      sfc.propTypes = {
        isLeaf: PropTypes.bool,
      };

      return sfc;
    }
    it('switcher icon', () => {
      const wrapper = render(
        <Tree defaultExpandAll switcherIcon={switcherIcon('switcherIcon')}>
          <TreeNode key="0-0" />
          <TreeNode key="0-1" switcherIcon={switcherIcon('switcherIconFromNode0-1')}>
            <TreeNode key="0-1-0" />
            <TreeNode key="0-1-1" />
          </TreeNode>
        </Tree>,
      );
      expect(wrapper).toMatchSnapshot();
    });

    it('switcher leaf icon', () => {
      const wrapper = render(
        <Tree defaultExpandAll switcherIcon={switcherIcon('switcherLeafIcon', true)}>
          <TreeNode key="0-0" />
          <TreeNode key="0-1" switcherIcon={switcherIcon('switcherLeafIconFromNode0-1', true)} />
          <TreeNode key="0-2">
            <TreeNode key="0-2-0" />
            <TreeNode
              key="0-2-1"
              switcherIcon={switcherIcon('switcherLeafIconFromNode0-2-1', true)}
            />
          </TreeNode>
          <TreeNode key="0-3" />
        </Tree>,
      );
      expect(wrapper).toMatchSnapshot();
    });
  });

  it('should style work', () => {
    const style = { background: 'red' };
    const wrapper = mount(<Tree style={style} />);
    expect(wrapper.props().style).toEqual(style);
  });
});
